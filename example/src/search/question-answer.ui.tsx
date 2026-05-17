import { MessageCircle } from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface QuestionAnswerUiProps {
  questionResult: {
    answer: string;
  };
}

export function QuestionAnswerUi({ questionResult }: QuestionAnswerUiProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          Answer
        </CardTitle>
        <CardDescription>
          Generated from the selected knowledge context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-zinc max-w-none dark:prose-invert">
          <MarkdownRenderer>{questionResult.answer}</MarkdownRenderer>
        </div>
      </CardContent>
    </Card>
  );
}
