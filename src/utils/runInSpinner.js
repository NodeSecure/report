// Import Third-party Dependencies
import { Spinner } from "@topcli/spinner";
import kleur from "kleur";

export async function runInSpinner(
  options,
  asyncHandler
) {
  const { title, verbose = true, start = void 0 } = options;

  const spinner = new Spinner({ verbose })
    .start(start, { withPrefix: `${kleur.gray().bold(title)} - ` });

  try {
    const response = await asyncHandler(spinner);

    const elapsed = `${spinner.elapsedTime.toFixed(2)}ms`;
    spinner.succeed(kleur.white().bold(`successfully executed in ${kleur.green().bold(elapsed)}`));

    return response;
  }
  catch (err) {
    spinner.failed(err.message);

    throw err;
  }
}
