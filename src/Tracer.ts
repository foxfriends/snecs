/**
 * Debugging facility for tracing and timing the execution of systems in a dispatcher.
 */
export class Tracer {
  constructor(public name: string) {
    this.start = process.hrtime.bigint();
    this.end = 0n;
  }

  public start: bigint;
  public end: bigint;
  public children: Tracer[] = [];

  child(name: string) {
    const child = new Tracer(name);
    this.children.push(child);
    return child;
  }

  done() {
    this.end = process.hrtime.bigint();
  }
}
