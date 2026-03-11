import { remark } from "remark";
import strip from "strip-markdown";

const markdownStripper = remark().use(strip);

export function markdownToPlainText(markdown: string): string {
  try {
    const normalized = markdown.replace(/\r\n/g, "\n");
    const plain = markdownStripper.processSync(normalized).toString();
    return plain.replace(/\n{3,}/g, "\n\n").trim();
  } catch (error) {
    console.error("Error processing markdown:", error);
    // Fallback: return the original text with basic markdown stripped
    return markdown
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
      .replace(/\*([^*]+)\*/g, "$1") // Remove italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

export function isSafeStoryMarkdown(markdown: string): boolean {
  const hasHtml = /<[^>]+>/.test(markdown);
  const hasCodeFence = /```/.test(markdown);
  return !hasHtml && !hasCodeFence;
}
