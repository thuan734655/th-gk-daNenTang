import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const colors = {
  bg: "#f4f6fb",
  ink: "#18233c",
  muted: "#64748b",
  primary: "#3458dc",
  border: "#dce3ef",
  danger: "#b42337",
};
export function Page({
  children,
  title,
  subtitle,
  footer,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.page}
        >
          <View style={s.content}>
            {title ? <Text style={s.title}>{title}</Text> : null}
            {Boolean(subtitle) && <Text style={s.muted}>{subtitle}</Text>}
            {children}
          </View>
        </ScrollView>
        {footer ? (
          <View
            style={{
              padding: 12,
              backgroundColor: "#fff",
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  tone = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        tone === "secondary"
          ? s.secondary
          : {
              backgroundColor:
                tone === "danger" ? colors.danger : colors.primary,
            },
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={{
          color: tone === "secondary" ? colors.ink : "#fff",
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  ...props
}: TextInputProps & {
  label: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#94a3b8"
        {...props}
        style={[s.input, props.style]}
      />
    </View>
  );
}
export function Message({
  text,
  success = false,
}: {
  text?: string;
  success?: boolean;
}) {
  return text ? (
    <Text
      accessibilityLiveRegion="polite"
      style={[
        s.message,
        {
          color: success ? "#166534" : colors.danger,
          backgroundColor: success ? "#ecfdf3" : "#fff1f2",
        },
      ]}
    >
      {text}
    </Text>
  ) : null;
}
export function Loading() {
  return (
    <ActivityIndicator
      style={{ padding: 32 }}
      size="large"
      color={colors.primary}
    />
  );
}
export const s = StyleSheet.create({
  page: { flexGrow: 1, alignItems: "center", padding: 20 },
  content: { width: "100%", maxWidth: 960, gap: 18 },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 10,
    minHeight: 46,
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: "#edf1fa",
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "#fff",
    minHeight: 48,
  },
  message: { padding: 13, borderRadius: 10, lineHeight: 22 },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: "#e8edfb",
  },
});
