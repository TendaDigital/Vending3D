export default class Deferred<T = unknown> {
  promise: Promise<T>
  resolve: (value?: T) => void
  reject: (reason?: any) => void
  constructor() {
    this.promise = new Promise<T>((_resolve, _reject) => {
      this.reject = _reject
      this.resolve = _resolve
    })
  }
}
