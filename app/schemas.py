from pydantic import BaseModel, Field
from typing import Optional, List, Any


class CategoryBase(BaseModel):
    name: str = Field(..., example="Marvel")
    slug: Optional[str] = Field(None, example="marvel")
    description: Optional[str] = Field(None, example="Heroes clásicos de Marvel")


class CategoryCreate(CategoryBase):
    # Para crear una categoría se recomienda enviar `slug` explícito
    slug: str


class Category(CategoryBase):
    id: Optional[Any]

    class Config:
        orm_mode = True


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    # `category` guarda el slug de la categoría (texto)
    category: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: Optional[Any]

    class Config:
        orm_mode = True


class IndexResponse(BaseModel):
    categories: List[Category]
    featured: List[Product]
