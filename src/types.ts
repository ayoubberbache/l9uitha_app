export interface User {
  id: number;
  email: string;
}

export interface Item {
  id: number;
  user_id: number;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  contact_info: string;
  status: 'active' | 'resolved';
  image_data?: string;
  created_at: string;
}

export type NewItem = Omit<Item, 'id' | 'status' | 'created_at' | 'user_id'>;
