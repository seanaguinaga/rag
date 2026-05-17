import { FileList } from "../components/FileList";
import { useSearch } from "./search.context";

export function SearchFileListController() {
  const { form, selectFile, selectCategory, selectSidebarScope } = useSearch();

  return (
    <FileList
      onFileSelect={selectFile}
      onCategorySelect={selectCategory}
      onSearchTypeChange={selectSidebarScope}
      selectedDocument={form.selectedDocument}
      onCategoriesChange={form.setCategories}
    />
  );
}
