/* eslint-disable @typescript-eslint/no-explicit-any */
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="border rounded-md p-2 bg-white">
      <CKEditor
        editor={ClassicEditor as unknown as any} // ✅ workaround for type error
        data={value}
        onChange={(_, editor: any) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
