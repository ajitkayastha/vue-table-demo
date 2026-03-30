export function debounce(fn, wait) {
  var timeoutId = null;

  return function debounced() {
    var context = this;
    var args = arguments;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(function execute() {
      fn.apply(context, args);
    }, wait);
  };
}
