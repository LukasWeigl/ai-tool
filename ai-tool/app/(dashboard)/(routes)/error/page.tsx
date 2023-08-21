"use client";

import axios from "axios";
import * as z from "zod";
import { Heading } from "@/components/heading";
import { CircleSlash, Code, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { formSchema } from "./constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatCompletionRequestMessage } from "openai";
import { Empty } from "@/components/empty";
import { Loader } from "@/components/loader";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avater";
import { BotAvatar } from "@/components/bot-avatar";
import ReactMarkdown from "react-markdown";

const ErrorPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([]);
  const formSchema = z.object({
    errorMessage: z.string(),
    userCode: z.string(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      errorMessage: "",
      userCode: "",
    },
});

  const isLoading = form.formState.isSubmitting;
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const userErrorMessage = values.errorMessage;
    const userCodeValue = values.userCode;

    const formattedUserCode = `\`\`\`\n${userCodeValue}\n\`\`\``;

    try {
      const userMessage: ChatCompletionRequestMessage = {
        role: "user",
        content: `${userErrorMessage}\n${userCodeValue}`,
      };
      const newMessages = [...messages, userMessage];

      const response = await axios.post("/api/error", {
        messages: newMessages,
      });
      setMessages((current) => [...current, userMessage, response.data]);
      form.reset();
    } catch (error: any) {
      //TODO: Open Pro Modal
      console.log(error);
    } finally {
      router.refresh;
    }
  };

  return (
    <>
      <div>
        <Heading
          title="Error Diagnostics"
          description="Provide explanations for common errors and suggest potential solutions"
          icon={CircleSlash}
          iconColor="text-red-700"
          bgColor="bg-red-700/10"
        />
      </div>
      <div className="px-4 lg:px-8">
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="rounded-lg border w-full p-4 px-3 md:px-6 focus-whitin:shadow-sm grid grid-cols-12 gap-2"
            >
              <FormField
                name="errorMessage"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        autoComplete="off"
                        className="border-0 outline-none
                      focus-visible:ring-0
                      focus-visible:ring-transparent"
                        disabled={isLoading}
                        placeholder="TypeError: 'NoneType' object is not iterable"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="userCode"
                render={({ field }) => (
                  <FormItem className="code-style col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <textarea
                        className="border-0 w-full h-80 outline-none
                     focus-visible:ring-0
                     focus-visible:ring-transparent code-style
                     overflow-auto my-2 bg-black/10 p-2 rounded-lg" // Added styles from ReactMarkdown
                        disabled={isLoading}
                        placeholder="Code Sample here"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <Button className="col-span-12 lg:col-span-2 w-full" disabled={isLoading}>Generate</Button>
            </form>
            
          </Form>
       
        </div>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {messages.length === 0 && !isLoading && (
            <div>
              <Empty label="No Conversation started." />
            </div>
          )}
          <div className="flex flex-col-reverse gap-y-4">
            {messages.map((message) => (
              <div
                key={message.content}
                className={cn(
                  "p-8 w-full flex items-start gap-x-8 rounded-lg",
                  message.role === "user"
                    ? "bg-white border border-black/10"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <ReactMarkdown
                  components={{
                    pre: ({ node, ...props }) => (
                      <div className="overflow-auto w-full my-2 bg-black/10 p-2 rounded-lg">
                        <pre {...props} />
                      </div>
                    ),
                    code: ({ node, ...props }) => (
                      <code className="bg-black/10 rounded-lg p1" {...props} />
                    ),
                  }}
                  className="text-sm overflow-hidden leading-7"
                >
                  {message.content || ""}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
