registrationSchema.statics.performDraw = async function (options) {
  try {
    const {
      commune,
      quota,
      reservePlace,
      oldQuotaAge,
      placesForEachCategory,
      ageCategories,
      page,
      limit,
    } = options;
    let winner;
    let reserve;
    let drawPool;
    let remainingQuota;
    let remainingReserve;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const calculateRemainingQuota = async (pipeline, totalQuota) => {
      let count = await Winner.aggregate(pipeline);
      count = count.length > 0 ? count[0].count : 0;
      return totalQuota !== undefined ? Math.max(0, totalQuota - count) : 0;
    };

    const processCategory = async (category) => {
      const pipeline = getCountAll(category.startAge, category.endAge);
      const remaining = await calculateRemainingQuota(pipeline, category.quota);
      if (remaining > 0) {
        drawPool = await this.getDrawPool(
          commune,
          category.startAge,
          category.endAge,
        );
        const result = await this.processDrawnUser(
          winner,
          drawPool,
          remaining,
          category.quota,
          category.count,
          commune,
          Winner,
        );
        winner = result.object;
        drawPool.unshift(winner);
        drawPool = drawPool.slice(startIndex, endIndex);
        return { winner, remaining, drawPool };
      }
    };

    if (!placesForEachCategory && !ageCategories) {
      const remainingQuota = await calculateRemainingQuota(
        getCountAll(),
        quota,
      );
      if (remainingQuota > 0) {
        drawPool = await this.getDrawPool(commune, oldQuotaAge);
        const result = await this.processDrawnUser(
          winner,
          drawPool,
          remainingQuota,
          quota,
          0,
          commune,
          Winner,
        );
        winner = result.object;
        drawPool.unshift(winner);
        drawPool = drawPool.slice(startIndex, endIndex);
        return { winner, remainingQuota: result.remaining, drawPool };
      }
    } else {
      for (let i = 0; i < ageCategories.length; i++) {
        const category = ageCategories[i];
        const result = await processCategory({
          startAge: category.startAge,
          endAge: category.endAge,
          quota: placesForEachCategory[i],
        });
        if (result) {
          return result;
        }
      }
    }

    const remainingReserve = await calculateRemainingQuota(
      getCountAll(),
      reservePlace,
    );
    if (remainingReserve > 0) {
      drawPool = await this.getDrawPool(commune);
      const result = await this.processDrawnUser(
        reserve,
        drawPool,
        remainingReserve,
        reservePlace,
        0,
        commune,
        Reserve,
      );
      reserve = result.object;
      drawPool.unshift(reserve);
      drawPool = drawPool.slice(startIndex, endIndex);
      return { reserve, remainingReserve: result.remaining, drawPool };
    }

    return { winner, reserve, remainingQuota, remainingReserve, drawPool };
  } catch (err) {
    console.error('Error in performDraw:', err);
    throw err;
  }
};
