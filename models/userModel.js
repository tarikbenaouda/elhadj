const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');
// List of 58 Wilayas
const wilayas = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/communes/wilayas.json`, {
    encoding: 'utf8',
    flag: 'r',
  }),
).map((wilay) => wilay.name);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please tell us your first name!'],
      minlength: [3, 'Is your first name less than 3 chars?'],
      maxlength: [30, 'Too long!'],
    },
    lastName: {
      type: String,
      required: [true, 'Please tell us your last name!'],
      minlength: [3, 'Is your last name less than 3 chars?'],
      maxlength: [30, 'Too long!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email!'],
      unique: [true, 'This email is already signed up!'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valide email!'],
    },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'doctor', 'admin', 'super-admin', 'postman', 'manager'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password!'],
      minlength: [8, 'Password must contain at least 8 characters!'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password!'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now(),
    },
    nationalNumber: {
      type: String,
      required: [true, 'Please enter your national number'],
      length: [9, 'The national number must be with 9 digits'],
      unique: [true, 'This national number is already signed up!'],
      validate: [
        validator.isNumeric,
        'Only digits are allowed in national number',
      ],
    },
    birthdate: {
      type: Date,
      required: [true, 'Please provide us your birthdate'],
      trim: true,
      validate: [validator.isDate, 'Please provide a valid birthdate!'],
    },
    wilaya: {
      type: String,
      required: [true, 'Please provide us your wilaya!'],
      enum: wilayas,
    },
    commune: {
      type: String,
      required: [true, 'Please provide us your commune!'],
      // TODO :: enum: communes,
    },
    address: {
      type: String,
      required: [true, 'Please provide us your address!'],
      minlength: [5, 'Please provide a valid address'],
      maxlength: [50, 'Please provide a valid address'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide us your phone number!'],
      minlength: [10, 'Please provide a valid phone number with 10 digits!'],
      maxlength: [10, 'Please provide a valid phone number with 10 digits!'],
      validate: [
        {
          validator: validator.isNumeric,
          message:
            'Please provide a valid phone number(Only digits are allowed!)',
        },
        {
          validator: (num) =>
            num.startsWith('05') ||
            num.startsWith('06') ||
            num.startsWith('07'),
          message: 'Please provide a valid phone number',
        },
      ],
    },
    sex: {
      type: String,
      required: [true, 'Please provide us your sexe!'],
      enum: ['male', 'female'],
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    // active: {
    //   type: Boolean,
    //   default: true,
    //   select: false,
    // },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
userSchema.index({ role: 1 });
userSchema.index({ commune: 1 });
userSchema.virtual('age').get(function () {
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
});

// Hashing Password before saving on the DB and deleting the passwordConfirm field
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomInt(0, 9999).toString().padStart(4, '0');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await this.save({ validateBeforeSave: false });
  return resetToken;
};
userSchema.methods.verifyOTP = function (otp) {
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  return this.passwordResetToken === hashedOTP;
};
userSchema.methods.changePassword = async function (
  newPassword,
  newPasswordConfirm,
) {
  this.password = newPassword;
  this.passwordConfirm = newPasswordConfirm;
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  this.passwordChangedAt = Date.now();
  await this.save();

  // await this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
