export interface PropMeta {
    name: string;
    type: string | null;
    default: string | null;
    required: boolean;
    description: string | null;
}

export interface SlotMeta {
    name: string;
    description: string | null;
}

export interface ComponentMeta {
    name: string;
    prefix: string;
    tag: string;
    packageName: string;
    filePath: string;
    props: PropMeta[];
    slots: SlotMeta[];
    description: string | null;
    selfClosing: boolean;
}
