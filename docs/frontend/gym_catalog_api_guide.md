# Aura Apex — Frontend Gym Catalog & Details API Guide

> **Target Audience:** Frontend Team (Mobile & Web)  
> **API Version:** v1 (`/api/v1`)  
> **Auth Scheme:** `Authorization: Bearer <accessToken>`

---

## 1. Environments & Base URLs

| Environment | Base URL |
|---|---|
| **Local Development** | `http://localhost:5000/api/v1` |
| **Production (Render)** | `https://gym-app-xtru.onrender.com/api/v1` |
| **Live Swagger Docs** | `http://localhost:5000/docs` or `https://gym-app-xtru.onrender.com/docs` |

---

## 2. API Endpoints Catalog

### 2.1. Public Gym Directory & Search
Fetches all public partner gyms with search and pagination support.

* **Method:** `GET`
* **Path:** `/api/v1/gyms/directory`
* **Auth:** Required (`Bearer <token>`)
* **Query Parameters:**
  * `page` (number, default: `1`)
  * `limit` (number, default: `20`, max `100`)
  * `search` (string, optional: e.g. `?search=Iron%20Gym`)

#### Response (`200 OK`):
```json
{
  "success": true,
  "message": "Public directory fetched successfully",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Aura Apex Fitness Hub",
      "slug": "aura-apex-hub",
      "phone": "+91 9876543210",
      "email": "contact@auraapex.com",
      "address": "Koregaon Park, Pune, Maharashtra",
      "description": "Premium strength and crossfit gym.",
      "logoUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
      "status": "active",
      "timings": {
        "monday": { "open": "06:00", "close": "22:00" },
        "tuesday": { "open": "06:00", "close": "22:00" },
        "saturday": { "open": "07:00", "close": "21:00" }
      },
      "weeklyOff": ["sunday"],
      "isSaved": false
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### 2.2. Single Gym Profile & Operating Hours
Fetches public details, operating hours, weekly off days, and contact details for a specific gym.

* **Method:** `GET`
* **Path:** `/api/v1/gyms/:gymId`
* **Auth:** Required (`Bearer <token>`)

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Aura Apex Fitness Hub",
    "address": "Koregaon Park, Pune",
    "phone": "+91 9876543210",
    "email": "contact@auraapex.com",
    "description": "Full-service fitness center with cardio and weight zones.",
    "logoUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
    "timings": {
      "monday": { "open": "06:00", "close": "22:00" },
      "tuesday": { "open": "06:00", "close": "22:00" }
    },
    "weeklyOff": ["sunday"],
    "status": "active"
  }
}
```

---

### 2.3. Membership Plans & Packages Catalog
Fetches active membership packages and pricing for a specific gym.

* **Method:** `GET`
* **Path:** `/api/v1/plans?gymId=<gymId>`
* **Auth:** Required (`Bearer <token>`)

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Monthly Pro",
      "price": 1499,
      "durationDays": 30,
      "description": "Unlimited gym floor and steam access",
      "features": [
        "All equipment access",
        "Locker room",
        "Free body composition analysis"
      ],
      "isActive": true
    },
    {
      "id": "a182c441-2b99-4c22-8314-14923e421098",
      "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Quarterly Elite",
      "price": 3999,
      "durationDays": 90,
      "description": "Quarterly membership with 1 personal training session",
      "features": [
        "Full gym floor access",
        "Trainer consultation",
        "Custom diet plan"
      ],
      "isActive": true
    }
  ]
}
```

---

### 2.4. Gym Photo Gallery
Fetches gym images (interior, exterior, equipment).

* **Method:** `GET`
* **Path:** `/api/v1/gallery?gymId=<gymId>`
* **Auth:** Required (`Bearer <token>`)

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "e45a9081-44bb-4e6a-a0f1-112233445566",
      "url": "https://jodthhltepjoepeaoano.supabase.co/storage/v1/object/public/gym-media/gyms/photo1.jpg",
      "caption": "Main Weight Training Zone",
      "entityType": "gym"
    }
  ]
}
```

---

### 2.5. Gym Trainers List
Fetches certified personal trainers associated with the gym.

* **Method:** `GET`
* **Path:** `/api/v1/trainers?gymId=<gymId>`
* **Auth:** Required (`Bearer <token>`)

#### Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "78a9c221-1234-4567-890a-bcdef1234567",
      "fullName": "Vikram Rathore",
      "specialization": "CrossFit & Strength Conditioning",
      "bio": "Certified strength coach with 6+ years experience.",
      "imageUrl": "https://images.unsplash.com/photo-1567013127542-490d757e51fc",
      "status": "active"
    }
  ]
}
```

---

### 2.6. Bookmark & Saved Gyms

#### Toggle Bookmark
* **Method:** `POST`
* **Path:** `/api/v1/gyms/:gymId/bookmark`
* **Auth:** Required
* **Response:**
  ```json
  {
    "success": true,
    "message": "Gym bookmarked successfully",
    "data": { "isSaved": true }
  }
  ```

#### Get Saved Gyms
* **Method:** `GET`
* **Path:** `/api/v1/gyms/saved`
* **Auth:** Required

---

### 2.7. Join Request (Linking Profile to Gym)

#### Submit Join Request
* **Method:** `POST`
* **Path:** `/api/v1/gyms/join-request`
* **Body:**
  ```json
  {
    "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```

#### Check Current Join Request Status
* **Method:** `GET`
* **Path:** `/api/v1/gyms/my-request`

---

## 3. Frontend Integration Example (TypeScript + Axios)

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://gym-app-xtru.onrender.com/api/v1',
});

// Attach Authorization Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // or AsyncStorage on mobile
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 1. Fetch Partner Gyms Directory */
export const getGymDirectory = async (searchQuery?: string, page = 1) => {
  const response = await apiClient.get('/gyms/directory', {
    params: { search: searchQuery, page, limit: 20 },
  });
  return response.data; // { data: Gym[], meta: { pagination } }
};

/** 2. Fetch Full Gym Catalog (Details + Plans + Gallery + Trainers) */
export const getFullGymCatalog = async (gymId: string) => {
  const [gymRes, plansRes, galleryRes, trainersRes] = await Promise.all([
    apiClient.get(`/gyms/${gymId}`),
    apiClient.get('/plans', { params: { gymId } }),
    apiClient.get('/gallery', { params: { gymId } }),
    apiClient.get('/trainers', { params: { gymId } }),
  ]);

  return {
    gym: gymRes.data.data,
    plans: plansRes.data.data,
    gallery: galleryRes.data.data,
    trainers: trainersRes.data.data,
  };
};

/** 3. Toggle Bookmark / Save */
export const toggleGymBookmark = async (gymId: string) => {
  const response = await apiClient.post(`/gyms/${gymId}/bookmark`);
  return response.data.data.isSaved;
};

/** 4. Submit Join Request */
export const submitGymJoinRequest = async (gymId: string) => {
  const response = await apiClient.post('/gyms/join-request', { gymId });
  return response.data.data;
};
```
