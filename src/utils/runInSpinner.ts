// Import Third-party Dependencies
import { Spinner } from "@topcli/spinner";

// Import Internal Dependencies
import { formatter } from "./formatter.ts";

export interface RunInSpinnerOptions {
  title: string;
  start: string;
  verbose: boolean;
}

export type RunInSpinnerHandler<R> = (spinner: Spinner) => Promise<R>;

export async function runInSpinner<R>(
  options: RunInSpinnerOptions,
  asyncHandler: RunInSpinnerHandler<R>
): Promise<R> {
  const { title, verbose = true, start = void 0 } = options;

  const spinner = new Spinner({ verbose })
    .start(start, { withPrefix: `${formatter.gray.bold(title)} - ` });

  try {
    const response = await asyncHandler(spinner);

    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(formatter.white.bold(`successfully executed in ${formatter.green.bold(elapsed)}`));

    return response;
  }
  catch (err: any) {
    spinner.failed(err.message);

    throw err;
  }
}
