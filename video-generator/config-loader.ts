/**
 * 設定ファイルローダー
 * 
 * screenshot.config.yaml / screenshot.config.json を読み込み、
 * コマンドライン引数とマージする
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export interface ScreenshotConfig {
  output: {
    format: 'png' | 'jpeg' | 'webp';
    quality: number;
    scale: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  browser: {
    headless: boolean;
    locale: string;
  };
  batch: {
    pattern: string;
    parallel: boolean;
  };
}

const DEFAULT_CONFIG: ScreenshotConfig = {
  output: {
    format: 'png',
    quality: 90,
    scale: 1,
  },
  viewport: {
    width: 1920,
    height: 1080,
  },
  browser: {
    headless: true,
    locale: 'ja-JP',
  },
  batch: {
    pattern: '*.html',
    parallel: false,
  },
};

/**
 * 設定ファイルを検索
 */
function findConfigFile(startDir: string = process.cwd()): string | null {
  const configNames = [
    'screenshot.config.yaml',
    'screenshot.config.yml',
    'screenshot.config.json',
  ];

  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    for (const name of configNames) {
      const configPath = path.join(currentDir, name);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * 設定ファイルを読み込み
 */
function loadConfigFile(configPath: string): Partial<ScreenshotConfig> {
  const content = fs.readFileSync(configPath, 'utf-8');
  const ext = path.extname(configPath).toLowerCase();

  if (ext === '.json') {
    return JSON.parse(content);
  } else if (ext === '.yaml' || ext === '.yml') {
    return yaml.parse(content);
  }

  throw new Error(`Unsupported config file format: ${ext}`);
}

/**
 * オブジェクトを深くマージ
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

/**
 * 設定を読み込む
 * 
 * 優先順位: コマンドライン引数 > 設定ファイル > デフォルト値
 */
export function loadConfig(cliOptions?: Partial<ScreenshotConfig>): {
  config: ScreenshotConfig;
  configPath: string | null;
} {
  let config = { ...DEFAULT_CONFIG };
  const configPath = findConfigFile();

  // 設定ファイルがあれば読み込み
  if (configPath) {
    try {
      const fileConfig = loadConfigFile(configPath);
      config = deepMerge(config, fileConfig);
    } catch (error: any) {
      console.warn(`Warning: Failed to load config file: ${error.message}`);
    }
  }

  // CLIオプションでオーバーライド
  if (cliOptions) {
    config = deepMerge(config, cliOptions);
  }

  // format の正規化
  if (config.output.format === 'jpg' as any) {
    config.output.format = 'jpeg';
  }

  return { config, configPath };
}

/**
 * 設定内容を表示
 */
export function printConfig(config: ScreenshotConfig, configPath: string | null): void {
  if (configPath) {
    console.log(`Config: ${configPath}`);
  } else {
    console.log('Config: (using defaults)');
  }
  console.log(`Format: ${config.output.format}, Quality: ${config.output.quality}, Scale: ${config.output.scale}x`);
  console.log(`Viewport: ${config.viewport.width}x${config.viewport.height}`);
}

export { DEFAULT_CONFIG };
