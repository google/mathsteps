export default function clone(node) {
  return JSON.parse(JSON.stringify(node));
}
