export interface TemplateVariable {
    name: string;
    label: string;
    type: "text" | "date" | "number" | "boolean";
    required?: boolean;
    defaultValue?: string;
}

export interface ContractTemplate {
    id: string;
    title: string;
    description?: string;
    contractType: string;
    contentHtml: string;
    contentJson?: string;
    contentText?: string;
    variables?: TemplateVariable[];
    isActive: boolean;
    version: number;
    createdByUser: { name: string };
    createdAt: string;
}

export interface CreateTemplateRequest {
    title: string;
    description?: string;
    contractType?: string;
    contentHtml: string;
    contentJson?: string;
    contentText?: string;
    variables?: TemplateVariable[];
}

export interface UpdateTemplateRequest {
    title?: string;
    description?: string;
    contractType?: string;
    contentHtml?: string;
    contentJson?: string;
    contentText?: string;
    variables?: TemplateVariable[];
}
