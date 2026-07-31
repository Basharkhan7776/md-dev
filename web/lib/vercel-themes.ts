/**
 * Vercel / Geist–inspired Shiki themes for code blocks.
 * Colors align with vercel.com docs (Geist palette).
 */
import type { ThemeRegistration } from "shiki";

export const vercelDark: ThemeRegistration = {
  name: "vercel-dark",
  type: "dark",
  bg: "#0a0a0a",
  fg: "#ededed",
  colors: {
    "editor.background": "#0a0a0a",
    "editor.foreground": "#ededed",
    "editorLineNumber.foreground": "#333333",
    "editorCursor.foreground": "#ededed",
  },
  settings: [
    { settings: { foreground: "#ededed", background: "#0a0a0a" } },
    {
      scope: [
        "comment",
        "punctuation.definition.comment",
        "string.comment",
      ],
      settings: { foreground: "#666666", fontStyle: "italic" },
    },
    {
      scope: ["string", "string.quoted", "string.template", "meta.embedded.assembly"],
      settings: { foreground: "#50e3c2" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other",
        "variable.other.constant",
      ],
      settings: { foreground: "#52a9ff" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.other.unit",
      ],
      settings: { foreground: "#f97583" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "meta.function-call entity.name.function",
      ],
      settings: { foreground: "#79c0ff" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "entity.other.inherited-class",
      ],
      settings: { foreground: "#ffa657" },
    },
    {
      scope: ["entity.name.tag", "punctuation.definition.tag"],
      settings: { foreground: "#7ee787" },
    },
    {
      scope: ["entity.other.attribute-name", "meta.attribute"],
      settings: { foreground: "#ff7b72" },
    },
    {
      scope: [
        "variable",
        "variable.other",
        "variable.parameter",
        "meta.definition.variable",
      ],
      settings: { foreground: "#ededed" },
    },
    {
      scope: ["punctuation", "meta.brace", "meta.delimiter"],
      settings: { foreground: "#8b949e" },
    },
    {
      scope: ["keyword.operator", "keyword.operator.assignment"],
      settings: { foreground: "#ededed" },
    },
    {
      scope: ["support.variable", "variable.language", "variable.language.this"],
      settings: { foreground: "#ff7b72" },
    },
    {
      scope: ["constant.language.boolean", "constant.language.null"],
      settings: { foreground: "#52a9ff" },
    },
    {
      scope: ["meta.object-literal.key", "support.type.property-name"],
      settings: { foreground: "#79c0ff" },
    },
    {
      scope: ["markup.heading", "entity.name.section"],
      settings: { foreground: "#79c0ff", fontStyle: "bold" },
    },
    {
      scope: ["markup.bold"],
      settings: { fontStyle: "bold", foreground: "#ededed" },
    },
    {
      scope: ["markup.italic"],
      settings: { fontStyle: "italic" },
    },
    {
      scope: ["markup.inline.raw", "markup.fenced_code"],
      settings: { foreground: "#50e3c2" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#f85149" },
    },
  ],
};

export const vercelLight: ThemeRegistration = {
  name: "vercel-light",
  type: "light",
  bg: "#fafafa",
  fg: "#171717",
  colors: {
    "editor.background": "#fafafa",
    "editor.foreground": "#171717",
    "editorLineNumber.foreground": "#a1a1a1",
    "editorCursor.foreground": "#171717",
  },
  settings: [
    { settings: { foreground: "#171717", background: "#fafafa" } },
    {
      scope: [
        "comment",
        "punctuation.definition.comment",
        "string.comment",
      ],
      settings: { foreground: "#666666", fontStyle: "italic" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "#0a7b61" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other",
        "variable.other.constant",
      ],
      settings: { foreground: "#0070f3" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "storage",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#d73a49" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
      ],
      settings: { foreground: "#005cc5" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
      ],
      settings: { foreground: "#b05a00" },
    },
    {
      scope: ["entity.name.tag"],
      settings: { foreground: "#22863a" },
    },
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#6f42c1" },
    },
    {
      scope: ["variable", "variable.other", "variable.parameter"],
      settings: { foreground: "#171717" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#6a737d" },
    },
    {
      scope: ["keyword.operator"],
      settings: { foreground: "#171717" },
    },
    {
      scope: ["variable.language", "variable.language.this"],
      settings: { foreground: "#d73a49" },
    },
    {
      scope: ["meta.object-literal.key", "support.type.property-name"],
      settings: { foreground: "#005cc5" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#cb2431" },
    },
  ],
};
