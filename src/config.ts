export type ConfigOption =
  | {
      key: 'MAX_BRANCHES' | 'CACHE_DURATION';
      label: string;
      defaultValue: number; // User-facing default value
      description?: string;
      validator?: (value: number) => boolean;
      /** Transforms a user-facing value to an internal value. */
      toInternal?: (value: number) => number;
      /** Transforms an internal value back to a user-facing value. */
      fromInternal?: (value: number) => number;
      /** An optional unit to display next to the value. */
      displayUnit?: string;
    }
  | {
      key: 'GITHUB_TOKEN';
      label: string;
      defaultValue: string;
      description?: string;
    };

// Helper type to infer the base type from a default value.
// This isolates the type logic, making it easy to add `boolean`, etc., later.
type BaseType<T> = T extends number ? number : T extends string ? string : never;

// Map directly over the ConfigOption union for a more concise and maintainable type.
// This creates a mapping from each option's `key` to the base type of its `defaultValue`.
export type ConfigValues = {
  [O in ConfigOption as O['key']]: BaseType<O['defaultValue']>;
};

function isNumberOption(
  option: ConfigOption,
): option is Extract<ConfigOption, { defaultValue: number }> {
  return typeof option.defaultValue === 'number';
}

export const CONFIG_OPTIONS: ConfigOption[] = [
  {
    key: 'MAX_BRANCHES',
    label: 'Max Branches',
    defaultValue: 7,
    description: 'Maximum number of branches to display',
    validator: (value: number) => value > 0 && value <= 50,
  },
  {
    key: 'CACHE_DURATION',
    label: 'Cache Duration (minutes)',
    defaultValue: 5, // User-facing value in minutes
    description: 'Cache duration in minutes',
    validator: (value: number) => value >= 1 && value <= 60,
    // Centralized transformation functions
    toInternal: (minutes: number) => minutes * 60 * 1000, // to milliseconds
    fromInternal: (ms: number) => ms / (60 * 1000), // to minutes
    displayUnit: 'minutes',
  },
  {
    key: 'GITHUB_TOKEN',
    label: 'GitHub Token',
    defaultValue: 'GH_TOKEN',
    description: 'Your GitHub personal access token',
  },
];

// Configuration manager class
export class ConfigManager {
  private config: ConfigValues = {} as ConfigValues;

  constructor() {
    this.loadConfig();
    this.registerMenuCommands();
  }

  private loadConfig(): void {
    CONFIG_OPTIONS.forEach((option) => {
      if (isNumberOption(option)) {
        const { key, defaultValue, toInternal } = option;
        const storedValue = GM_getValue(key, defaultValue);
        // Apply transformation if it exists, otherwise use the value as is.
        this.config[key] = toInternal ? toInternal(storedValue) : storedValue;
      } else {
        const { key, defaultValue } = option;
        const storedValue = GM_getValue(key, defaultValue);
        this.config[key] = storedValue;
      }
    });
  }

  private registerMenuCommands(): void {
    CONFIG_OPTIONS.forEach((option) => {
      GM_registerMenuCommand(`⚙️ Set ${option.label}`, () => {
        this.showConfigDialog(option);
      });
    });

    GM_registerMenuCommand('📋 Show Current Config', () => {
      this.showCurrentConfig();
    });

    GM_registerMenuCommand('🔄 Reset to Defaults', () => {
      this.resetToDefaults();
    });
  }

  private showConfigDialog(option: ConfigOption): void {
    let currentValue: number | string = this.config[option.key];
    // Convert internal value to user-facing value for display if needed.
    if (isNumberOption(option) && option.fromInternal) {
      currentValue = option.fromInternal(currentValue as number);
    }

    const description = option.description ? `\n${option.description}` : '';
    const promptMessage = `${option.label}${description}\n\nCurrent value: ${currentValue}`;

    const newValue = prompt(promptMessage, String(currentValue));

    if (newValue !== null) {
      this.updateConfig(option, newValue);
    }
  }

  // Update configuration value
  private updateConfig(option: ConfigOption, newValue: string): void {
    if (isNumberOption(option)) {
      const parsedValue = parseFloat(newValue);
      if (isNaN(parsedValue)) {
        alert(`Invalid number: ${newValue}`);
        return;
      }

      if (option.validator && !option.validator(parsedValue)) {
        alert(`Invalid value for ${option.label}. Please check the constraints.`);
        return;
      }

      const { key, toInternal, label } = option;
      // Always store the user-facing value in GM storage.
      GM_setValue(key, parsedValue);
      // Apply transformation for internal state.
      this.config[key] = toInternal ? toInternal(parsedValue) : parsedValue;
      alert(`${label} updated to: ${parsedValue}`);
    } else {
      const { key, label } = option;
      GM_setValue(key, newValue);
      this.config[key] = newValue;
      alert(`${label} updated to: ${newValue}`);
    }
  }

  private showCurrentConfig(): void {
    const configText = CONFIG_OPTIONS.map((option) => {
      if (isNumberOption(option)) {
        const { key, fromInternal, label, displayUnit } = option;
        let displayValue: number = this.config[key];
        // Use transformation and add unit for display if they exist.
        if (fromInternal) {
          displayValue = fromInternal(displayValue);
        }
        const unit = displayUnit ? ` ${displayUnit}` : '';

        return `${label}: ${displayValue}${unit}`;
      } else {
        const { key, label } = option;
        return `${label}: ${this.config[key]}`;
      }
    }).join('\n');

    alert(`Current Configuration:\n\n${configText}`);
  }

  private resetToDefaults(): void {
    if (confirm('Reset all configuration to default values?')) {
      CONFIG_OPTIONS.forEach((option) => {
        // Store the user-facing default value.

        if (isNumberOption(option)) {
          const { key, defaultValue, toInternal } = option;
          GM_setValue(key, defaultValue);
          // Apply transformation for internal state.
          this.config[key] = toInternal ? toInternal(defaultValue) : defaultValue;
        } else {
          const { key, defaultValue } = option;
          GM_setValue(key, defaultValue);
          this.config[key] = defaultValue;
        }
      });
      alert('Configuration reset to defaults!');
    }
  }

  // Get all the `ConfigValues`
  public getConfig(): ConfigValues {
    return { ...this.config };
  }

  // Get individual config values
  public get<K extends keyof ConfigValues>(key: K): ConfigValues[K] {
    return this.config[key];
  }
}

// Initialize configuration manager
export const configManager = new ConfigManager();
