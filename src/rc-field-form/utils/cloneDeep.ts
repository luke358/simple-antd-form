// @ts-ignore
function cloneDeep(val) {
  if (Array.isArray(val)) {
    return cloneArrayDeep(val);
  } else if (typeof val === 'object' && val !== null) {
    return cloneObjectDeep(val);
  }
  return val;
}
// @ts-ignore
function cloneObjectDeep(val) {
  if (Object.getPrototypeOf(val) === Object.prototype) {
    const res = {};
    for (const key in val) {
      // @ts-ignore

      res[key] = cloneDeep(val[key]);
    }
    return res;
  }
  return val;
}
// @ts-ignore
function cloneArrayDeep(val) {
  // @ts-ignore
  return val.map(item => cloneDeep(item));
}

export default cloneDeep;
