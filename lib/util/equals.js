function equals(left, right) {
  const leftKeys = Object.keys(left).filter((key) => key !== 'changeGroup');
  const rightKeys = Object.keys(right).filter((key) => key !== 'changeGroup');

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    const leftVal = left[key];
    const rightVal = right[key];

    if (typeof leftVal !== typeof rightVal) {
      return false;
    }

    if (typeof leftVal === "object") {
      if (!equals(leftVal, rightVal)) {
        return false;
      }
    } else {
      if (leftVal !== rightVal) {
        return false;
      }
    }
  }

  return true;
}

module.exports = equals;
