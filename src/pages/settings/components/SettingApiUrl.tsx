// Copyright (c) 2021-2025 Drew Edwards
// This file is part of KanjiSchool under AGPL-3.0.
// Full details: https://github.com/Lemmmy/KanjiSchool/blob/master/LICENSE

import { useCallback, useState } from "react";
import { Space, Input, Button } from "antd";

import { menuItemSettingInner } from "./settingsStyles.ts";
import { SettingDescription } from "./SettingDescription.tsx";

const LS_KEY_API_URL = "kanjischool-apiUrl";
const LS_KEY_CUSTOM_TOKEN = "kanjischool-customApiToken";
const DEFAULT_PLACEHOLDER = "https://api.wanikani.com/v2";

export function SettingApiUrl(): JSX.Element {
  const [value, setValue] = useState<string>(
    localStorage.getItem(LS_KEY_API_URL) ?? ""
  );

  const savedValue = localStorage.getItem(LS_KEY_API_URL) ?? "";
  const isDirty = value !== savedValue;

  const onSave = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(LS_KEY_API_URL, trimmed);
    } else {
      localStorage.removeItem(LS_KEY_API_URL);
    }
    // Clear the custom token so it re-migrates on next login
    localStorage.removeItem(LS_KEY_CUSTOM_TOKEN);
  }, [value]);

  return <div className={menuItemSettingInner}>
    <div className="flex items-center gap-sm">
      {/* Input and save button */}
      <Space.Compact className="inline-block w-auto">
        {/* URL input */}
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          onPressEnter={onSave}
          placeholder={DEFAULT_PLACEHOLDER}
          style={{ minWidth: 280 }}
        />

        {/* Save button */}
        <Button
          type="primary"
          disabled={!isDirty}
          onClick={onSave}
        >
          Save
        </Button>
      </Space.Compact>

      {/* Item title */}
      <div>
        API URL
      </div>
    </div>

    <SettingDescription description={
      "Override the WaniKani API base URL. Leave blank to use the default. " +
      "Changing this will clear the stored auth token and require re-login."
    } />
  </div>;
}
