import { useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { IoMdRedo, IoMdUndo } from "react-icons/io";
import { AiOutlineOrderedList, AiOutlineStrikethrough } from "react-icons/ai";
import {
    LuAlignCenter,
    LuAlignJustify,
    LuAlignLeft,
    LuAlignRight,
    LuHighlighter,
    LuLink,
} from "react-icons/lu";
import { MdFormatListBulleted } from "react-icons/md";
import { GrBlockQuote } from "react-icons/gr";
import { BiCodeBlock } from "react-icons/bi";

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
                ${
                    active
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
    undo: <IoMdUndo />,
    redo: <IoMdRedo />,
    bold: <span className="text-[13px] font-bold leading-none">B</span>,
    italic: <span className="text-[13px] italic leading-none">I</span>,
    strike: <AiOutlineStrikethrough />,
    code: <span className="font-mono text-[11px] leading-none">&lt;/&gt;</span>,
    underline: (
        <span className="text-[13px] font-semibold leading-none underline">
            U
        </span>
    ),
    highlight: <LuHighlighter />,
    link: <LuLink />,
    super: <span className="text-[11px] leading-none">x²</span>,
    sub: <span className="text-[11px] leading-none">x₂</span>,
    alignLeft: <LuAlignLeft />,
    alignCenter: <LuAlignCenter />,
    alignRight: <LuAlignRight />,
    alignJustify: <LuAlignJustify />,
    bulletList: <MdFormatListBulleted />,
    orderedList: <AiOutlineOrderedList />,
    blockquote: <GrBlockQuote />,
    codeBlock: <BiCodeBlock />,
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
                    editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: val as 1 | 2 | 3 | 4 })
                        .run();
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
            editor
                .chain()
                .focus()
                .setLink({ href: url, target: "_blank" })
                .run();
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
            <Btn
                title="Undo"
                disabled={!editor.can().undo()}
                onClick={() => c().undo().run()}
            >
                {icons.undo}
            </Btn>
            <Btn
                title="Redo"
                disabled={!editor.can().redo()}
                onClick={() => c().redo().run()}
            >
                {icons.redo}
            </Btn>

            <Divider />

            {/* Block type */}
            <HeadingSelect editor={editor} />
            <Divider />
            <Btn
                title="Bullet list"
                active={editor.isActive("bulletList")}
                onClick={() => c().toggleBulletList().run()}
            >
                {icons.bulletList}
            </Btn>
            <Btn
                title="Ordered list"
                active={editor.isActive("orderedList")}
                onClick={() => c().toggleOrderedList().run()}
            >
                {icons.orderedList}
            </Btn>
            <Btn
                title="Blockquote"
                active={editor.isActive("blockquote")}
                onClick={() => c().toggleBlockquote().run()}
            >
                {icons.blockquote}
            </Btn>
            <Btn
                title="Code block"
                active={editor.isActive("codeBlock")}
                onClick={() => c().toggleCodeBlock().run()}
            >
                {icons.codeBlock}
            </Btn>

            <Divider />

            {/* Inline formatting */}
            <Btn
                title="Bold"
                active={editor.isActive("bold")}
                onClick={() => c().toggleBold().run()}
            >
                {icons.bold}
            </Btn>
            <Btn
                title="Italic"
                active={editor.isActive("italic")}
                onClick={() => c().toggleItalic().run()}
            >
                {icons.italic}
            </Btn>
            <Btn
                title="Strikethrough"
                active={editor.isActive("strike")}
                onClick={() => c().toggleStrike().run()}
            >
                {icons.strike}
            </Btn>
            <Btn
                title="Inline code"
                active={editor.isActive("code")}
                onClick={() => c().toggleCode().run()}
            >
                {icons.code}
            </Btn>
            <Btn
                title="Underline"
                active={editor.isActive("underline")}
                onClick={() => c().toggleUnderline().run()}
            >
                {icons.underline}
            </Btn>
            <Btn
                title="Highlight"
                active={editor.isActive("highlight")}
                onClick={() => c().toggleHighlight().run()}
            >
                {icons.highlight}
            </Btn>
            <LinkButton editor={editor} />

            <Divider />

            {/* Script */}
            <Btn
                title="Superscript"
                active={editor.isActive("superscript")}
                onClick={() => c().toggleSuperscript().run()}
            >
                {icons.super}
            </Btn>
            <Btn
                title="Subscript"
                active={editor.isActive("subscript")}
                onClick={() => c().toggleSubscript().run()}
            >
                {icons.sub}
            </Btn>

            <Divider />

            {/* Alignment */}
            <Btn
                title="Align left"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => c().setTextAlign("left").run()}
            >
                {icons.alignLeft}
            </Btn>
            <Btn
                title="Align center"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => c().setTextAlign("center").run()}
            >
                {icons.alignCenter}
            </Btn>
            <Btn
                title="Align right"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => c().setTextAlign("right").run()}
            >
                {icons.alignRight}
            </Btn>
            <Btn
                title="Justify"
                active={editor.isActive({ textAlign: "justify" })}
                onClick={() => c().setTextAlign("justify").run()}
            >
                {icons.alignJustify}
            </Btn>
        </div>
    );
}

// ── Main export ─────────────────────────────────────────────────────────────

export default function ContractEditor({ initialContent, onChange }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Start drafting your contract…",
            }),
            Underline,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Highlight,
            Link.configure({ openOnClick: false }),
            Subscript,
            Superscript,
        ],
        content:
            initialContent ??
            `<h2>Service Agreement</h2>
<p>This Service Agreement is made between <strong>Provider</strong> and <strong>Client</strong>.</p>
<p><strong>Scope of work:</strong> …</p>
<p><strong>Payment terms:</strong> …</p>
<p><strong>Term and termination:</strong> …</p>`,
        editorProps: {
            attributes: {
                class: "tiptap contract-prose min-h-[480px] outline-none",
            },
        },
        onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
        onCreate: ({ editor: e }) => onChange?.(e.getHTML()),
    });

    if (!editor) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-700/60 bg-[#141414] shadow-2xl">
            <Toolbar editor={editor} />
            <EditorContent
                editor={editor}
                className="px-8 py-6 text-gray-100"
            />
        </div>
    );
}
