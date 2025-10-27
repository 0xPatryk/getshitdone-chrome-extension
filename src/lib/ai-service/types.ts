/**
 * AI Service Types
 *
 * This module contains type definitions for the AI service domain.
 * It defines the supported AI providers and related type structures.
 *
 * @module ai-service/types
 */

/**
 * Supported AI providers for content analysis and chat functionality.
 * @typedef {"gemini" | "openai"} AIProvider
 */
export type AIProvider = "gemini" | "openai";
