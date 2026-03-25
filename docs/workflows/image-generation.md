# Image Generation Workflow

## Overview

This document describes the current image-generation support path. The runtime uses a Replicate client plus a small image-generator service, and it caches results when a cache context is provided.

## Provider

- **Provider**: Replicate
- **Authentication**: `REPLICATE_API_KEY`
- **Model**: configurable via `REPLICATE_IMAGE_MODEL`

Environment variables are documented in `.env.example` and `docs/operations/var.README.md`.

## High-Level Flow

1. A prompt task or supporting workflow constructs an image prompt.
2. `src/services/imageGenerator.ts` optionally checks the image cache.
3. `src/clients/replicateClient.ts` runs the model and downloads the returned image.
4. The service returns a `Buffer` and cache metadata to the caller.
5. The caller decides whether to attach the image to a reply or fall back to text.

## Current Service Surface

- `src/services/imageGenerator.ts` - high-level image service
- `src/clients/replicateClient.ts` - Replicate API client
- `src/cache/imageCache.ts` - cache key helpers and interface
- `src/cache/lruImageCache.ts` - optional LRU cache implementation
- `prompts/tasks/generate_image.yaml` - task prompt for image generation

## Prompt Rules

- Do not expose internal metrics or scores in the prompt
- Keep prompts platform-safe
- Avoid secrets in prompts
- Use a deterministic cache context when caching is enabled

## Error Handling

| Error Type | Cause | Action |
|---|---|---|
| Auth Error | Invalid / missing token | Check environment |
| Model Not Found | Wrong model slug | Validate `REPLICATE_IMAGE_MODEL` |
| Timeout | Provider delay | Retry bounded by the client timeout |
| Safety Refusal | Provider policy block | Fall back to text-only output |
| Download Fail | Network / URL issue | Log error and fall back to text-only output |

## Observability

Log, without secrets:

- `model`
- `fromCache`
- `latencyMs`
- `cacheKey` context if needed

Never log:

- API tokens
- private user metadata
- full prompt content in production

## Local Testing Checklist

- [ ] `REPLICATE_API_KEY` present
- [ ] `REPLICATE_IMAGE_MODEL` configured
- [ ] generation completes once successfully
- [ ] cache hit / miss is observable when cache is enabled
- [ ] caller handles text fallback when generation fails
