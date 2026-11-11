import { useState } from "react";
import { Text, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userFormSchema } from "@/schemas/user.schema";
import { AvatarPicker } from "./AvatarPicker";
import { Button, Field, Message, s } from "./ui/kit";
import type { PublicUser } from "@/types/user";
export type UserInput = {
  email: string;
  hoten: string;
  matkhau?: string;
  image?: string;
};
export function UserForm({
  initial,
  canSetPassword = true,
  submitLabel,
  onSubmit,
  showImage = true,
}: {
  initial?: PublicUser;
  canSetPassword?: boolean;
  submitLabel: string;
  onSubmit: (input: UserInput) => Promise<void>;
  showImage?: boolean;
}) {
  const [image, setImage] = useState<string>();
  const [error, setError] = useState("");
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initial?.email ?? "",
      hoten: initial?.hoten ?? "",
      matkhau: "",
    },
  });
  return (
    <View style={s.card}>
      {showImage && (
        <AvatarPicker value={image ?? initial?.hinhanh} onChange={setImage} />
      )}
      {(
        ["hoten", "email", ...(canSetPassword ? ["matkhau"] : [])] as (
          "hoten" | "email" | "matkhau"
        )[]
      ).map((name) => (
        <View key={name} style={{ gap: 6 }}>
          <Controller
            control={control}
            name={name}
            render={({ field: { value, onChange, onBlur } }) => (
              <Field
                label={
                  name === "hoten"
                    ? "Họ và tên"
                    : name === "email"
                      ? "Email"
                      : initial
                        ? "Mật khẩu mới (để trống nếu giữ nguyên)"
                        : "Mật khẩu"
                }
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isSubmitting}
                autoCapitalize={name === "hoten" ? "words" : "none"}
                autoCorrect={false}
                secureTextEntry={name === "matkhau"}
                keyboardType={name === "email" ? "email-address" : "default"}
              />
            )}
          />
          {errors[name] && (
            <Text style={{ color: "#b42337" }}>{errors[name]?.message}</Text>
          )}
        </View>
      ))}
      <Message text={error} />
      <Button
        title={isSubmitting ? "Đang lưu…" : submitLabel}
        disabled={isSubmitting}
        onPress={handleSubmit(async (values) => {
          setError("");
          if (
            (!initial || values.matkhau) &&
            canSetPassword &&
            values.matkhau.length < 8
          ) {
            setError("Mật khẩu cần ít nhất 8 ký tự.");
            return;
          }
          try {
            await onSubmit({
              email: values.email,
              hoten: values.hoten,
              ...(values.matkhau && canSetPassword
                ? { matkhau: values.matkhau }
                : {}),
              ...(image ? { image } : {}),
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Không lưu được.");
          }
        })}
      />
    </View>
  );
}
