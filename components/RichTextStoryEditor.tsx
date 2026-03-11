"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getEditorMarkdown(editor: Editor): string {
  const editorWithMarkdown = editor as Editor & {
    getMarkdown?: () => string;
  };
  return editorWithMarkdown.getMarkdown?.().trim() ?? "";
}

function getEditorPlainText(editor: Editor): string {
  return editor.getText({ blockSeparator: "\n\n" }).trim();
}

export function RichTextStoryEditor({
  id,
  initialMarkdown,
  placeholder,
  labels,
  onChange,
}: {
  id: string;
  initialMarkdown: string;
  placeholder: string;
  labels: {
    bold: string;
    italic: string;
    bulletList: string;
    orderedList: string;
    quote: string;
    undo: string;
    redo: string;
  };
  onChange: (markdown: string, plainText: string) => void;
}) {
  const [activeMarks, setActiveMarks] = useState({
    bold: false,
    italic: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
  });

  function syncActiveMarks(editor: Editor) {
    const next = {
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
    };
    setActiveMarks(next);
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: initialMarkdown,
    contentType: "markdown",
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      onChange(getEditorMarkdown(editor), getEditorPlainText(editor));
      syncActiveMarks(editor);
    },
    onUpdate: ({ editor }) => {
      onChange(getEditorMarkdown(editor), getEditorPlainText(editor));
      syncActiveMarks(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      syncActiveMarks(editor);
    },
    onTransaction: ({ editor }) => {
      syncActiveMarks(editor);
    },
    editorProps: {
      attributes: {
        id,
        class:
          "min-h-[280px] leading-relaxed border border-border bg-transparent rounded-none p-5 text-lg shadow-none focus:outline-none transition-colors story-editor-content",
        style: "font-family: var(--font-serif), Georgia, serif;",
      },
    },
  });

  return (
    <div className="space-y-3">
      {/*
        High-contrast active style so selected formatting is unmistakable
        against the dark theme.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.bold}
          aria-pressed={activeMarks.bold}
          title={labels.bold}
          className={`rounded-none border-border ${
            activeMarks.bold
              ? "!bg-primary !text-primary-foreground !border-primary"
              : "bg-transparent text-foreground"
          }`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.italic}
          aria-pressed={activeMarks.italic}
          title={labels.italic}
          className={`rounded-none border-border ${
            activeMarks.italic
              ? "!bg-primary !text-primary-foreground !border-primary"
              : "bg-transparent text-foreground"
          }`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.bulletList}
          aria-pressed={activeMarks.bulletList}
          title={labels.bulletList}
          className={`rounded-none border-border ${
            activeMarks.bulletList
              ? "!bg-primary !text-primary-foreground !border-primary"
              : "bg-transparent text-foreground"
          }`}
          onClick={() => {
            if (!editor) return;
            editor.chain().focus().toggleBulletList().run();
          }}
        >
          <List className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.orderedList}
          aria-pressed={activeMarks.orderedList}
          title={labels.orderedList}
          className={`rounded-none border-border ${
            activeMarks.orderedList
              ? "!bg-primary !text-primary-foreground !border-primary"
              : "bg-transparent text-foreground"
          }`}
          onClick={() => {
            if (!editor) return;
            editor.chain().focus().toggleOrderedList().run();
          }}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.quote}
          aria-pressed={activeMarks.blockquote}
          title={labels.quote}
          className={`rounded-none border-border ${
            activeMarks.blockquote
              ? "!bg-primary !text-primary-foreground !border-primary"
              : "bg-transparent text-foreground"
          }`}
          onClick={() => {
            if (!editor) return;
            editor.chain().focus().toggleBlockquote().run();
          }}
        >
          <Quote className="h-4 w-4" aria-hidden />
        </Button>
        <div className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.undo}
          title={labels.undo}
          className="rounded-none border-border"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={labels.redo}
          title={labels.redo}
          className="rounded-none border-border"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
