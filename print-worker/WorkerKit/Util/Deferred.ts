export default function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.reject = reject
    this.resolve = resolve
  })
}
