"use client";
import { useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { uploadImage } from "@/lib/upload";

export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), Image],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "article min-h-[260px] px-3 py-2 outline-none" } },
  });
  if (!editor) return <div className="min-h-[300px] rounded-lg border bg-background" />;

  const btn = (active: boolean) =>
    `rounded-lg border px-2 py-1 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-background"}`;

  async function addImage(file?: File) {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      editor!.chain().focus().setImage({ src: url }).run();
    } catch (e) { alert((e as Error).message); }
  }
  function addLink() {
    const url = prompt("Link URL (https://…)");
    if (url) editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-wrap gap-1 border-b p-2">
        <button type="button" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
        <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>उप-शीर्षक</button>
        <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• सूची</button>
        <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>“ उद्धरण</button>
        <button type="button" className={btn(editor.isActive("link"))} onClick={addLink}>लिंक</button>
        <button type="button" className={btn(false)} onClick={() => fileRef.current?.click()}>फ़ोटो</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
