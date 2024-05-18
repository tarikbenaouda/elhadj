const fs = require('fs');

const maleNames = [
  'Karim',
  'Mohamed',
  'Ahmed',
  'Aissa',
  'Yazid',
  'Sofiane',
  'Rachid',
  'Omar',
  'Nabil',
  'Djamel',
  'Lounes',
  'Farid',
  'Kamel',
  'Messaoud',
  'Slimane',
  'Salah',
  'Mokhtar',
  'Aziz',
  'Noureddine',
  'Azzedine',
  'Fares',
  'Ibrahim',
  'Walid',
  'Zine el-Abidine',
  'Bilal',
  'Anis',
  'Ryad',
  'Massinissa',
  'Amir',
  'Nadir',
  'Rafik',
  'Youcef',
  'Samir',
  'Mehdi',
];

const femaleNames = [
  'Fatima',
  'Sarah',
  'Aïcha',
  'Meryem',
  'Leïla',
  'Kahina',
  'Yasmine',
  'Nabila',
  'Djamila',
  'Amina',
  'Khedidja',
  'Souad',
  'Nadia',
  'Farida',
  'Amel',
  'Warda',
  'Malika',
  'Nawal',
  'Rim',
  'Ichraf',
  'Samia',
  'Hayet',
  'Zohra',
  'Leila',
  'Aïcha',
  'Warda',
  'Ines',
  'Nadjet',
  'Aïcha',
  'Sofia',
  'Fatiha',
  'Camelia',
  'Nesrine',
  'Fadwa',
];

const lastNames = [
  'Belkacem',
  'Benali',
  'Ferhani',
  'Attia',
  'Zerrouki',
  'Abdelkrim',
  'Messaoud',
  'Boutefnouchet',
  'Boualem',
  'Kaci',
  'Tebbal',
  'Sellal',
  'Ould Abbes',
  'Bedoui',
  'Hanoune',
  'Belaïd',
  'Djaballah',
  'Gaïd Salah',
  'Toufik',
  'Belkhadem',
  'Bouteflika',
  'Zeroual',
  'Chadli',
  'Boumediene',
  'Ben Bella',
  'Krim Belkacem',
  'Lakhضر',
  'Yahi',
  'Mediene',
  'Tebboune',
  'Sellal',
  'Ould Khelifa',
  'Ould Abbès',
  'Zitouni',
  'Djabou',
  'Bennour',
];

const emailDomains = ['@outlook.com', '@gmail.com', '@yahoo.com'];
const communes = ['Sidi Bel-Abbes', 'Ain Thrid', 'Telagh'];
const streetNamePrefixes = ['Rue', 'Avenue', 'Boulevard'];
const streetNameSuffixes = [
  'Emir Abdelkader',
  'Mohamed Khider',
  "Larbi Ben M'hidi",
  'Houari Boumediene',
  '5 Juillet',
];

function getRandomName(isMale) {
  const names = isMale ? maleNames : femaleNames;
  return names[Math.floor(Math.random() * names.length)];
}

function generateUniqueNationalNumber(usedNumbers) {
  let nationalNumber;
  do {
    nationalNumber = Math.floor(Math.random() * 100000000); // Generate 9-digit number
  } while (usedNumbers.has(nationalNumber));
  usedNumbers.add(nationalNumber);
  return nationalNumber;
}

function generateRandomBirthdate() {
  const minYear = new Date().getFullYear() - 59;
  const maxYear = new Date().getFullYear() - 35;
  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1; // Adjust for leap years if needed

  return new Date(year, month, day);
}

function generateRandomPhone() {
  const prefixes = ['06', '05', '07'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let phoneNumber = prefix;
  for (let i = 0; i < 8; i++) {
    phoneNumber += Math.floor(Math.random() * 10);
  }
  return phoneNumber;
}

function generateRandomAddress() {
  const prefix =
    streetNamePrefixes[Math.floor(Math.random() * streetNamePrefixes.length)];
  const suffix =
    streetNameSuffixes[Math.floor(Math.random() * streetNameSuffixes.length)];
  return `${prefix} ${suffix}`;
}

function determineSex(lastName, femaleNames, maleNames) {
  if (femaleNames.includes(lastName)) {
    return 'female';
  } else if (maleNames.includes(lastName)) {
    return 'male';
  } else {
    return 'unknown';
  }
}

function generateUser(isMale) {
  const firstName = getRandomName(isMale);
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const email =
    `${firstName}.${lastName}${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`.toLowerCase();
  const password = `${firstName}${lastName}`.toLowerCase();
  const nationalNumber = generateUniqueNationalNumber(new Set());
  const birthdate = generateRandomBirthdate();
  const wilaya = 'Sidi Bel Abbes';
  const commune = communes[Math.floor(Math.random() * communes.length)];
  const address = generateRandomAddress();
  const phone = generateRandomPhone();
  const sex = determineSex(firstName, femaleNames, maleNames);

  return {
    firstName,
    lastName,
    email,
    password,
    passwordConfirm: password,
    nationalNumber,
    birthdate,
    wilaya,
    commune,
    address,
    phone,
    sex,
  };
}

const users = [];
const usedNationalNumbers = new Set();

for (let i = 0; i < 20; i++) {
  const isMale = Math.random() < 0.5;
  users.push(generateUser(isMale));
}
fs.writeFile('doctor.json', JSON.stringify(users, null, 2), (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
console.log(users);
