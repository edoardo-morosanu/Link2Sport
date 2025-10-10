import { API_BASE_URL } from '@/utils/constants';

export interface Sport {
  id: number;
  name: string;
}

export class SportService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async getAllSports(): Promise<Sport[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sports: ${response.statusText}`);
      }

      const sports: Sport[] = await response.json();
      return sports;
    } catch (error) {
      console.error('Error fetching sports:', error);
      throw error;
    }
  }

  static async getSportById(id: number): Promise<Sport> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sports/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sport: ${response.statusText}`);
      }

      const sport: Sport = await response.json();
      return sport;
    } catch (error) {
      console.error(`Error fetching sport with id ${id}:`, error);
      throw error;
    }
  }

  static async createSport(name: string): Promise<Sport> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sports`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create sport: ${response.statusText}`);
      }

      const sport: Sport = await response.json();
      return sport;
    } catch (error) {
      console.error('Error creating sport:', error);
      throw error;
    }
  }

  static async updateSport(id: number, name: string): Promise<Sport> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sports/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update sport: ${response.statusText}`);
      }

      const sport: Sport = await response.json();
      return sport;
    } catch (error) {
      console.error(`Error updating sport with id ${id}:`, error);
      throw error;
    }
  }

  static async deleteSport(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sports/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete sport: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting sport with id ${id}:`, error);
      throw error;
    }
  }

  static async searchSports(query: string): Promise<Sport[]> {
    try {
      const sports = await this.getAllSports();
      return sports.filter(sport =>
        sport.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching sports:', error);
      throw error;
    }
  }
}
