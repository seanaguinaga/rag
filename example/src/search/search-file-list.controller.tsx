import { FileList } from "../components/FileList";
import { useSearchCategories, useSearchSelection } from "./search.context";

export function SearchFileListController() {
  const { selectedDocument, selectFile, selectCategory, selectSidebarScope } =
    useSearchSelection();
  const { setCategories } = useSearchCategories();

  return (
    <FileList
      onFileSelect={selectFile}
      onCategorySelect={selectCategory}
      onSearchTypeChange={selectSidebarScope}
      selectedDocument={selectedDocument}
      onCategoriesChange={setCategories}
    />
  );
}
