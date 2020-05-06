import chalk from "chalk";

export function warn(message: string) {
  console.warn(chalk.yellow(`${chalk.bold("Warning")}: ${message}`));
}
