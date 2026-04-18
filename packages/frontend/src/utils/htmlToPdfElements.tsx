import { Text, View, type TextProps } from "@react-pdf/renderer";

const BODY_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const ACCENT_COLOR = "#4f46e5";

type PdfStyle = TextProps["style"] & Record<string, unknown>;

const baseText: PdfStyle = { fontSize: 11, color: BODY_COLOR, lineHeight: 1.6 };

function renderInline(node: ChildNode, style: PdfStyle = baseText, key: number = 0): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        if (!text) return null;
        return <Text key={key} style={style}>{text}</Text>;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const kids = (s: PdfStyle) => Array.from(el.childNodes).map((c, i) => renderInline(c, s, i));

    switch (tag) {
        case "strong":
        case "b": {
            const s = { ...style, fontWeight: "bold" } as PdfStyle;
            return <Text key={key} style={s}>{kids(s)}</Text>;
        }
        case "em":
        case "i": {
            const s = { ...style, fontStyle: "italic" } as PdfStyle;
            return <Text key={key} style={s}>{kids(s)}</Text>;
        }
        case "u": {
            const s = { ...style, textDecoration: "underline" } as PdfStyle;
            return <Text key={key} style={s}>{kids(s)}</Text>;
        }
        case "s":
        case "del":
        case "strike": {
            const s = { ...style, textDecoration: "line-through" } as PdfStyle;
            return <Text key={key} style={s}>{kids(s)}</Text>;
        }
        case "code":
            return <Text key={key} style={{ ...style, fontFamily: "Courier", fontSize: 9, color: "#374151" } as PdfStyle}>{el.textContent}</Text>;
        case "br":
            return <Text key={key}>{"\n"}</Text>;
        default:
            return <Text key={key} style={style}>{kids(style)}</Text>;
    }
}

function renderBlock(node: ChildNode, key: number): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent ?? "").trim();
        if (!text) return null;
        return <Text key={key} style={baseText}>{text}</Text>;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
        case "h1":
            return (
                <View key={key} style={{ marginBottom: 8, marginTop: 14 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: BODY_COLOR }}>{el.textContent}</Text>
                </View>
            );
        case "h2":
            return (
                <View key={key} style={{ marginBottom: 6, marginTop: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: BODY_COLOR }}>{el.textContent}</Text>
                </View>
            );
        case "h3":
            return (
                <View key={key} style={{ marginBottom: 5, marginTop: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: BODY_COLOR }}>{el.textContent}</Text>
                </View>
            );
        case "h4":
            return (
                <View key={key} style={{ marginBottom: 4, marginTop: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: BODY_COLOR }}>{el.textContent}</Text>
                </View>
            );
        case "p": {
            const inlineNodes = Array.from(el.childNodes).map((c, i) => renderInline(c, baseText, i));
            return (
                <View key={key} style={{ marginBottom: 6 }}>
                    <Text style={baseText}>{inlineNodes}</Text>
                </View>
            );
        }
        case "blockquote":
            return (
                <View key={key} style={{ borderLeft: "3px solid #6366f1", paddingLeft: 10, marginVertical: 6 }}>
                    <Text style={{ fontSize: 11, color: MUTED_COLOR, fontStyle: "italic", lineHeight: 1.6 }}>
                        {el.textContent}
                    </Text>
                </View>
            );
        case "ul": {
            const items = Array.from(el.querySelectorAll(":scope > li"));
            return (
                <View key={key} style={{ marginBottom: 6, marginLeft: 12 }}>
                    {items.map((li, i) => (
                        <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
                            <Text style={{ fontSize: 11, color: ACCENT_COLOR, marginRight: 6, width: 10 }}>{"•"}</Text>
                            <Text style={{ fontSize: 11, color: BODY_COLOR, flex: 1, lineHeight: 1.5 }}>{li.textContent}</Text>
                        </View>
                    ))}
                </View>
            );
        }
        case "ol": {
            const items = Array.from(el.querySelectorAll(":scope > li"));
            return (
                <View key={key} style={{ marginBottom: 6, marginLeft: 12 }}>
                    {items.map((li, i) => (
                        <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
                            <Text style={{ fontSize: 11, color: ACCENT_COLOR, marginRight: 6, width: 16 }}>{`${i + 1}.`}</Text>
                            <Text style={{ fontSize: 11, color: BODY_COLOR, flex: 1, lineHeight: 1.5 }}>{li.textContent}</Text>
                        </View>
                    ))}
                </View>
            );
        }
        case "hr":
            return <View key={key} style={{ borderBottom: "1px solid #e5e7eb", marginVertical: 10 }} />;
        case "pre":
        case "code":
            return (
                <View key={key} style={{ backgroundColor: "#f3f4f6", borderRadius: 4, padding: 8, marginVertical: 6 }}>
                    <Text style={{ fontSize: 9, fontFamily: "Courier", color: "#374151" }}>{el.textContent}</Text>
                </View>
            );
        default:
            return Array.from(el.childNodes).map((c, i) => renderBlock(c, i));
    }
}

export function htmlToPdfElements(html: string): React.ReactNode[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return Array.from(doc.body.childNodes).map((node, i) => renderBlock(node, i));
}
