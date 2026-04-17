import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";

type ContractEditorProps = {
    initialContent?: string;
    onChange?: (html: string) => void;
};

export default function ContractEditor({
    initialContent,
    onChange,
}: ContractEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Start drafting your contract...",
            }),
        ],
        content:
            initialContent ??
            `<h2>Service Agreement</h2>
<p>This Service Agreement is made between <strong>Provider</strong> and <strong>Client</strong>.</p>
<p><strong>Scope of work:</strong> ...</p>
<p><strong>Payment terms:</strong> ...</p>
<p><strong>Term and termination:</strong> ...</p>`,
        editorProps: {
            attributes: {
                class: "tiptap min-h-[420px] outline-none",
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            onChange?.(currentEditor.getHTML());
        },
        onCreate: ({ editor: currentEditor }) => {
            onChange?.(currentEditor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <section className="w-full rounded-2xl border border-indigo-500/30 bg-gray-900/70 shadow-xl shadow-indigo-900/20 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2 border-b border-gray-700 p-3">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        editor.isActive("bold")
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                    }`}
                >
                    Bold
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        editor.isActive("italic")
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                    }`}
                >
                    Italic
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        editor.isActive("bulletList")
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                    }`}
                >
                    Bullet List
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        editor.isActive("orderedList")
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700"
                    }`}
                >
                    Numbered List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
                >
                    Undo
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
                >
                    Redo
                </button>
            </div>
            <EditorContent
                editor={editor}
                className="px-6 py-5 text-gray-100"
            />
        </section>
    );
}
