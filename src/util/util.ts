namespace util {
function appendToArrayInObject(dict: Array<any>, key: number, value: any) {
  if (dict[key]) {
    dict[key].push(value);
  }
  else {
    dict[key] = [value];
  }
  return dict;
};
}