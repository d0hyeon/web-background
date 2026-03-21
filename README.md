# Web Background

**Simple Web Worker Library - Run complex tasks in the background!**

Web Background is a simple yet powerful library that enables you to execute heavy computations in the background without blocking the main thread in web browsers.

## Features

- 🎯 **Simple API**: Execute workers instantly with a single function
- 🧹 **Automatic Memory Management**: Auto-cleanup workers and cache on GC
- 💪 **Full TypeScript Support**: Complete type safety
- 📦 **Zero Dependencies**: No external dependencies

## 🚀 Quick Start

### Basic Usage

```typescript
import { background } from "web-background";

// Simple background execution
const heavyCalculation = background((numbers: number[]) => {
  // CPU intensive task
  return numbers.reduce((sum, num) => sum + Math.sqrt(num), 0);
});

// Execute without blocking main thread
const result = await heavyCalculation([1, 4, 9, 16, 25]);
console.log(result); // 15

// When external variables are needed (required context passing)
const multiplier = 10;
const processWithContext = background(
  (numbers: number[]) => numbers.map((x) => x * multiplier),
  { multiplier },
);
```

### Complex Real-world Example

```typescript
// Image data processing
const generateBluredData = background((imageData: ImageData) => {
  const { data, width, height } = imageData;
  const processed = new Uint8ClampedArray(data.length);

  // Apply Gaussian blur
  for (let i = 0; i < data.length; i += 4) {
    const y = Math.floor(i / 4 / width);
    const x = Math.floor(i / 4 - width * y);

    processed[i] = data[i] * 0.8; // R
    processed[i + 1] = data[i + 1] * 0.8; // G
    processed[i + 2] = data[i + 2] * 0.8; // B
    processed[i + 3] = data[i + 3]; // A
  }

  return processed;
});

// Usage
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const blurredData = await generateBluredData(originalData);
ctx.putImageData(new ImageData(blurredData), 0, 0);
```

## API Reference

### `background<T>(fn: T, context?: Record<string, any>): FunctionInBackground<T>`

Converts a function to run in a web worker.

**Parameters:**

- `fn`: Function to execute in the background
- `context` (optional): Explicitly pass external variables when needed

**Returns:**

- Function with the same signature as the original but returns a `Promise`

**Type:**

```typescript
type FunctionInBackground<Fn> = (
  ...params: Parameters<Fn>
) => Promise<ReturnType<Fn>>;
```

## 📋 Constraints & Guidelines

### ✅ What's Available

- Pure computation logic
- JSON serializable data (strings, numbers, arrays, objects, etc.)
- Built-in global objects like `Math`, `Date`, `JSON`
- Explicitly passed functions and variables

### ❌ What's Not Available

- DOM APIs (`document`, `window`, etc.)
- Web APIs (`fetch`, `localStorage`, etc. have separate worker support)
- Non-serializable data (functions, Symbols, undefined, etc.)
- ES6 module imports (context passing required in bundler environments)
