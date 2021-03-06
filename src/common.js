export const ANILIST_BASE_URL = 'https://graphql.anilist.co'

export const SEARCH_QUERY = `query ($search: String, $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
        pageInfo {
            total
            lastPage
        }
        staff(search: $search) {
            id
            name {
                full
            }
            favourites
        		image {
                    medium
            }
            characters {
                pageInfo {
                    total
                }
            }
        }
    }
}`;

export const STAFF_QUERY = `query ($id : Int) {
    Staff(id: $id) {
        id
        name {
            full
        }
        favourites
        image {
            large
        }
        description
        siteUrl
        characters (perPage: 50) {
            pageInfo {
                total
                lastPage
            }
        }
    }
}`;

export const CHARACTERS_QUERY = `query ($id: Int, $page: Int, $perPage: Int) {
    Staff(id: $id) {
        id
        characters(page: $page, perPage: $perPage) {
            pageInfo {
                hasNextPage
                total
                lastPage
            }
            edges {
                role
                media {
                    siteUrl
                    type
                    averageScore
                    title {
                        romaji
                    }
                    coverImage {
                        medium
                    }
                    season
                    startDate {
                        year
                        month
                    }
                    popularity
                    status
                }
                node {
                    siteUrl
                    id
                    favourites
                    image {
                        medium
                    }
                    name {
                        full
                    }
                }
            }
        }
    }
}`

export const PLACEHOLDER_SEIYUUS = ['Kana Hanazawa', 'Sugita Tomokazu', 'Kamiya Hiroshi', 'Uchida Maaya'];

export const APP_NAME = "SeiyuuList";