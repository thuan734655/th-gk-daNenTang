import { useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Message, s } from "./ui/kit";
export function AvatarPicker({
  value,
  onChange,
  label = "Ảnh đại diện",
  placeholderIcon = "👤",
  disabled,
}: {
  value?: string;
  onChange: (data: string) => void;
  label?: string;
  placeholderIcon?: string;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function pick(camera: boolean) {
    setError("");
    setBusy(true);
    try {
      if (
        camera &&
        !(await ImagePicker.requestCameraPermissionsAsync()).granted
      )
        throw new Error("Bạn cần cấp quyền camera.");
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        base64: true,
        quality: 0.75,
        allowsEditing: Platform.OS !== "web",
        aspect: [1, 1],
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64)
        throw new Error("Không đọc được ảnh. Hãy chọn ảnh khác.");
      if ((asset.fileSize ?? asset.base64.length * 0.75) > 4 * 1024 * 1024)
        throw new Error("Ảnh tối đa 4 MB.");
      // Native base64 output is JPEG. Web keeps the selected file format.
      const mime =
        Platform.OS === "web" ? (asset.mimeType ?? "image/jpeg") : "image/jpeg";
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
        throw new Error("Chọn ảnh JPG, PNG hoặc WebP.");
      onChange(`data:${mime};base64,${asset.base64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không chọn được ảnh.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        {value ? (
          <Image source={{ uri: value }} style={s.avatar} />
        ) : (
          <View
            style={[
              s.avatar,
              { alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Text style={{ fontSize: 28 }}>{placeholderIcon}</Text>
          </View>
        )}
        <Button
          title="Chọn ảnh"
          tone="secondary"
          disabled={busy || disabled}
          onPress={() => void pick(false)}
        />
        {Platform.OS !== "web" && (
          <Button
            title="Chụp ảnh"
            tone="secondary"
            disabled={busy || disabled}
            onPress={() => void pick(true)}
          />
        )}
      </View>
      <Text style={s.muted}>JPG, PNG, WebP · tối đa 4 MB</Text>
      <Message text={error} />
    </View>
  );
}
