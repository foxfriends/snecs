class Trace {
  public start: bigint;
  public end: bigint;

  constructor(public name: string) {
    this.start = process.hrtime.bigint();
    this.end = 0n;
  }

  done() {
    this.end = process.hrtime.bigint();
  }
}

export class Tracer {
  public trace: Trace[] = [];

  start(name: string) {
    const trace = new Trace(name);
    this.trace.push(trace);
    return trace;
  }
}
