import { apiClient } from './client';

export interface UpdateProfileData {
  sex: 'MALE' | 'FEMALE';
  birthDate: string; // ISO datetime
  handicap: number;
}

export const profileApi = {
  async updateMyProfile(data: UpdateProfileData) {
    const response = await apiClient.put('/users/me/profile', data);
    return response.data.data;
  },
};
