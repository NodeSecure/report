// Import Node.js Dependencies
import {
  styleText,
  type InspectColorForeground,
  type InspectColorBackground,
  type InspectColorModifier
} from "node:util";

type StyleName = InspectColorForeground | InspectColorBackground | InspectColorModifier;

type Formatter = {
  (text: string): string;
} & {
  [K in StyleName]: Formatter;
};

function createFormatter(styles: StyleName[] = []): Formatter {
  return new Proxy(
    (text: string) => styleText(styles, text),
    {
      get: (_, prop: string) => createFormatter([...styles, prop as StyleName])
    }
  ) as Formatter;
}

const formatter = createFormatter();

export { formatter };
