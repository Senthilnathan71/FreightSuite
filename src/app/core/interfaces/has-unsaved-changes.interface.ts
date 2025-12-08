export interface HasUnsavedChanges {
    hasUnsavedChanges(): boolean;
    saveChanges(): Promise<boolean>;
}
