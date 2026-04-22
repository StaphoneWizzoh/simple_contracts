import ReactSelect, {
    type Props as ReactSelectProps,
    type GroupBase,
    type StylesConfig,
} from "react-select";

/* ── Dark-theme style map for react-select ───────────────────────── */
function buildStyles<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>,
>(error?: boolean): StylesConfig<Option, IsMulti, Group> {
    const focusBorder = error ? "#f87171" : "#6366f1";
    const focusShadow = error
        ? "0 0 0 3px rgba(248,113,113,0.3)"
        : "0 0 0 3px rgba(99,102,241,0.3)";

    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: "#1f2937",
            borderColor: state.isFocused
                ? focusBorder
                : error
                ? "rgba(248,113,113,0.6)"
                : "rgba(55,65,81,0.6)",
            boxShadow: state.isFocused ? focusShadow : "none",
            "&:hover": {
                borderColor: state.isFocused ? focusBorder : "#374151",
            },
            borderRadius: "0.5rem",
            minHeight: "42px",
            cursor: "pointer",
            transition: "border-color 150ms, box-shadow 150ms",
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "2px 12px",
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: "#1f2937",
            border: "1px solid rgba(55,65,81,0.7)",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6), 0 4px 10px -2px rgba(0,0,0,0.4)",
            zIndex: 9999,
            overflow: "hidden",
        }),
        menuList: (base) => ({
            ...base,
            padding: "6px",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "rgba(79,70,229,0.35)"
                : state.isFocused
                ? "rgba(55,65,81,0.8)"
                : "transparent",
            color: state.isSelected ? "#a5b4fc" : "#d1d5db",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            "&:active": { backgroundColor: "rgba(79,70,229,0.25)" },
        }),
        singleValue: (base) => ({
            ...base,
            color: "#f3f4f6",
            fontSize: "0.875rem",
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: "rgba(79,70,229,0.2)",
            borderRadius: "6px",
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: "#a5b4fc",
            fontSize: "0.8125rem",
            paddingLeft: "8px",
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: "#818cf8",
            borderRadius: "0 6px 6px 0",
            "&:hover": { backgroundColor: "rgba(79,70,229,0.4)", color: "#fff" },
        }),
        placeholder: (base) => ({
            ...base,
            color: "#6b7280",
            fontSize: "0.875rem",
        }),
        input: (base) => ({
            ...base,
            color: "#f3f4f6",
            fontSize: "0.875rem",
        }),
        indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: "rgba(55,65,81,0.6)",
        }),
        dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isFocused ? "#818cf8" : "#6b7280",
            "&:hover": { color: "#818cf8" },
            padding: "0 10px",
        }),
        clearIndicator: (base) => ({
            ...base,
            color: "#6b7280",
            "&:hover": { color: "#f87171" },
            padding: "0 6px",
        }),
        noOptionsMessage: (base) => ({
            ...base,
            color: "#6b7280",
            fontSize: "0.875rem",
        }),
        loadingMessage: (base) => ({
            ...base,
            color: "#6b7280",
            fontSize: "0.875rem",
        }),
        groupHeading: (base) => ({
            ...base,
            color: "#9ca3af",
            fontSize: "0.6875rem",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            paddingLeft: "8px",
        }),
    };
}

export interface SelectProps<
    Option = unknown,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
> extends ReactSelectProps<Option, IsMulti, Group> {
    error?: boolean;
}

export function Select<
    Option = unknown,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>({ error, styles: externalStyles, ...props }: SelectProps<Option, IsMulti, Group>) {
    const styles = buildStyles<Option, IsMulti, Group>(error);

    const mergedStyles: StylesConfig<Option, IsMulti, Group> = externalStyles
        ? Object.fromEntries(
              Object.keys({ ...styles, ...externalStyles }).map((key) => {
                  const k = key as keyof typeof styles;
                  return [
                      k,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (base: any, state: any) => {
                          const s = styles[k]?.(base, state) ?? base;
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          return (externalStyles[k] as any)?.(s, state) ?? s;
                      },
                  ];
              }),
          )
        : styles;

    return (
        <ReactSelect
            {...props}
            styles={mergedStyles}
            classNamePrefix="rs"
            menuPortalTarget={document.body}
            menuPosition="fixed"
        />
    );
}

// Re-export react-select helpers for convenience
export type { SingleValue, MultiValue, ActionMeta, Options } from "react-select";
