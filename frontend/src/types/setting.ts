import { SettingId } from "./id";

export type SettingName = "bb.branding.logo" | "bb.app.im";

export type Setting = {
  id: SettingId;

  // Domain specific fields
  name: SettingName;
  value: string;
  description: string;
};

type IMType = "im.feishu";

export interface SettingAppIMValue {
  imType: IMType;
  appId: string;
  appSecret: string;
  externalApproval: {
    enabled: boolean;
  };
}
