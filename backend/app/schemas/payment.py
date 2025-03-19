from pydantic import BaseModel, Field

class StripePayment(BaseModel):
    price: str
    plan: str
    product: str

    class Config:
        orm_mode = True
