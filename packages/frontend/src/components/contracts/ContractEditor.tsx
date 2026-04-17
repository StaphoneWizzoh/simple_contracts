import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

type Props = {
    initialContent?: string;
    onChange?: (html: string) => void;
};

// ── Toolbar primitives ──────────────────────────────────────────────────────

function Divider() {
    return <div className="mx-1 h-5 w-px bg-gray-600/60" />;
}

type BtnProps = {
    active?: boolean;
    disabled?: boolean;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
};

function Btn({ active, disabled, title, onClick, children }: BtnProps) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-7 w-7 items-center justify-center rounded text-sm transition
                ${active
                    ? "bg-white/15 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }
                disabled:cursor-not-allowed disabled:opacity-30`}
        >
            {children}
        </button>
    );
}

// ── SVG icons ───────────────────────────────────────────────────────────────

const icons = {
    undo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
    ),
    redo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
        </svg>
    ),
    bold: <span className="text-[13px] font-bold leading-none">B</span>,
    italic: <span className="text-[13px] italic leading-none">I</span>,
    strike: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" />
        </svg>
    ),
    code: <span className="font-mono text-[11px] leading-none">&lt;/&gt;</span>,
    underline: <span className="text-[13px] font-semibold leading-none underline">U</span>,
    highlight: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
        </svg>
    ),
    link: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    super: <span className="text-[11px] leading-none">x²</span>,
    sub: <span className="text-[11px] leading-none">x₂</span>,
    alignLeft: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="17" y1="18" x2="3" y2="18" />
        </svg>
    ),
    alignCenter: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="21" y1="6" x2="3" y2="6" /><line x1="17" y1="12" x2="7" y2="12" /><line x1="19" y1="18" x2="5" y2="18" />
        </svg>
    ),
    alignRight: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="18" x2="7" y2="18" />
        </svg>
    ),
    alignJustify: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="12" x2="3" y2="12" /><line x1="21" y1="18" x2="3" y2="18" />
        </svg>
    ),
    bulletList: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
    ),
    orderedList: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" stroke="currentColor" strokeWidth={1.5} /><path d="M4 10h2" stroke="currentColor" strokeWidth={1.5} />
            <path d="M6 14H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" strokeWidth={1.5} />
        </svg>
    ),
    blockquote: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
    ),
    codeBlock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
    ),
};

// ── Heading select ──────────────────────────────────────────────────────────

function HeadingSelect({ editor }: { editor: Editor }) {
    const getLevel = () => {
        for (const level of [1, 2, 3, 4] as const) {
            if (editor.isActive("heading", { level })) return String(level);
        }
        return "0";
    };

    return (
        <select
            value={getLevel()}
            onChange={(e) => {
                const val = Number(e.target.value);
                if (val === 0) {
                    editor.chain().focus().setParagraph().run();
                } else {
                    editor.chain().focus().toggleHeading({ level: val as 1 | 2 | 3 | 4 }).run();
                }
            }}
            className="h-7 rounded bg-transparent px-1 text-xs text-gray-300 hover:bg-white/10 focus:outline-none cursor-pointer"
        >
            <option value="0">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
        </select>
    );
}

// ── Link dialog ─────────────────────────────────────────────────────────────

function LinkButton({ editor }: { editor: Editor }) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");

    const apply = () => {
        if (!url) {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
        }
        setOpen(false);
        setUrl("");
    };

    return (
        <div className="relative">
            <Btn
                title="Link"
                active={editor.isActive("link")}
                onClick={() => {
                    setUrl(editor.getAttributes("link").href ?? "");
                    setOpen((o) => !o);
                }}
            >
                {icons.link}
            </Btn>
            {open && (
                <div className="absolute left-0 top-9 z-50 flex gap-2 rounded-lg border border-gray-600 bg-gray-800 p-2 shadow-xl">
                    <input
                        autoFocus
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && apply()}
                        placeholder="https://..."
                        className="w-52 rounded bg-gray-700 px-2 py-1 text-xs text-gray-100 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={apply}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor }) {
    const c = editor.chain().focus;

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-700/60 bg-[#1c1c1e] px-2 py-1.5">
            {/* History */}
            <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => c().undo().run()}>{icons.undo}</Btn>
            <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => c().redo().run()}>{icons.redo}</Btn>

            <Divider />

            {/* Block type */}
            <HeadingSelect editor={editor} />
            <Divider />
            <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>{icons.bulletList}</Btn>
            <Btn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>{icons.orderedList}</Btn>
            <Btn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>{icons.blockquote}</Btn>
            <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => c().toggleCodeBlock().run()}>{icons.codeBlock}</Btn>

            <Divider />

            {/* Inline formatting */}
            <Btn title="Bold" active={editor.isActive("bold")} onClick={() => c().toggleBold().run()}>{icons.bold}</Btn>
            <Btn title="Italic" active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}>{icons.italic}</Btn>
            <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}>{icons.strike}</Btn>
            <Btn title="Inline code" active={editor.isActive("code")} onClick={() => c().toggleCode().run()}>{icons.code}</Btn>
            <Btn title="Underline" active={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}>{icons.underline}</Btn>
            <Btn title="Highlight" active={editor.isActive("highlight")} onClick={() => c().toggleHighlight().run()}>{icons.highlight}</Btn>
            <LinkButton editor={editor} />

            <Divider />

            {/* Script */}
            <Btn title="Superscript" active={editor.isActive("superscript")} onClick={() => c().toggleSuperscript().run()}>{icons.super}</Btn>
            <Btn title="Subscript" active={editor.isActive("subscript")} onClick={() => c().toggleSubscript().run()}>{icons.sub}</Btn>

            <Divider />

            {/* Alignment */}
            <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => c().setTextAlign("left").run()}>{icons.alignLeft}</Btn>
            <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => c().setTextAlign("center").run()}>{icons.alignCenter}</Btn>
            <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => c().setTextAlign("right").run()}>{icons.alignRight}</Btn>
            <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => c().setTextAlign("justify").run()}>{icons.alignJustify}</Btn>
        </div>
    );
}

// ── Main export ─────────────────────────────────────────────────────────────

export default function ContractEditor({ initialContent, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Start drafting your contract…" }),
            Underline,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Highlight,
            Link.configure({ openOnClick: false }),
            Subscript,
            Superscript,
        ],
        content: initialContent ??
            `<h2>Service Agreement</h2>
<p>This Service Agreement is made between <strong>Provider</strong> and <strong>Client</strong>.</p>
<p><strong>Scope of work:</strong> …</p>
<p><strong>Payment terms:</strong> …</p>
<p><strong>Term and termination:</strong> …</p>`,
        editorProps: {
            attributes: { class: "tiptap contract-prose min-h-[480px] outline-none" },
        },
        onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
        onCreate: ({ editor: e }) => onChange?.(e.getHTML()),
    });

    if (!editor) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#141414] shadow-2xl">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} className="px-8 py-6 text-gray-100" />
        </div>
    );
}
