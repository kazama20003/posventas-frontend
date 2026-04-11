"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { ArrowLeft, ImagePlus, Plus, Save, Trash2 } from "lucide-react"

import { useCategories } from "@/lib/api/categories"
import {
  PRODUCT_TYPE_VALUES,
  UNIT_OF_MEASURE_VALUES,
  getApiErrorMessage,
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from "@/lib/api/products"
import { useDeleteUploadImage, useUploadImage } from "@/lib/api/uploads"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PRODUCT_IMAGE_FOLDER,
  defaultFormValues,
  formatMoney,
  formatProductType,
  formatTaxRate,
  getCategoryDisplayMeta,
  getFormValuesFromProduct,
  readRouteParam,
  toCreatePayload,
  toUpdatePayload,
  validateProduct,
  type ProductFormErrors,
  type ProductFormValues,
  type ProductImageFormValue,
  type ProductVariantFormValue,
} from "./product-form-utils"

export function ProductFormPageClient({
  mode,
  productId,
}: {
  mode: "create" | "edit"
  productId?: string
}) {
  const params = useParams()
  const router = useRouter()
  const slug = readRouteParam(params?.slug)
  const productsHref = slug ? `/app/${slug}/products` : "/app"
  const isEditing = mode === "edit"

  const [formValues, setFormValues] = useState<ProductFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null)
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null)
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([])

  const categoriesQuery = useCategories()
  const productQuery = useProduct(isEditing ? productId : null, {
    enabled: isEditing,
  })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const uploadImage = useUploadImage()
  const deleteUploadImage = useDeleteUploadImage()

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const product = productQuery.data ?? null

  useEffect(() => {
    if (!isEditing) {
      setFormValues(defaultFormValues)
      return
    }

    if (!product) return

    setFormValues(getFormValuesFromProduct(product))
    setFormErrors({})
    setActionError(null)
    imageInputRefs.current = []
  }, [isEditing, product])

  function handleFieldChange<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K]
  ) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  function handleImageChange(
    index: number,
    field: keyof ProductImageFormValue,
    value: string
  ) {
    setFormValues((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image
      ),
    }))

    setFormErrors((current) => {
      const nextImageErrors = [...(current.imageErrors ?? [])]
      if (nextImageErrors[index]) {
        nextImageErrors[index] = {
          ...nextImageErrors[index],
          [field]: undefined,
        }
      }

      return {
        ...current,
        images: undefined,
        imageErrors: nextImageErrors,
      }
    })
    setActionError(null)
  }

  function handleVariantChange(
    index: number,
    field: keyof ProductVariantFormValue,
    value: string
  ) {
    setFormValues((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      ),
    }))

    setFormErrors((current) => {
      const nextVariantErrors = [...(current.variantErrors ?? [])]
      if (nextVariantErrors[index]) {
        nextVariantErrors[index] = {
          ...nextVariantErrors[index],
          [field]: undefined,
        }
      }

      return {
        ...current,
        variants: undefined,
        variantErrors: nextVariantErrors,
      }
    })
    setActionError(null)
  }

  function removeImageAtIndex(index: number) {
    imageInputRefs.current.splice(index, 1)

    setFormValues((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }))
    setFormErrors((current) => ({
      ...current,
      images: undefined,
      imageErrors: (current.imageErrors ?? []).filter(
        (_, imageIndex) => imageIndex !== index
      ),
    }))
  }

  function handleAddImage() {
    setFormValues((current) => {
      if (current.images.length >= 10) return current
      return {
        ...current,
        images: [...current.images, { key: "", url: "" }],
      }
    })
    setFormErrors((current) => ({ ...current, images: undefined }))
  }

  function handleAddVariant() {
    setFormValues((current) => {
      if (current.variants.length >= 100) return current
      return {
        ...current,
        variants: [
          ...current.variants,
          {
            sku: "",
            barcode: "",
            unitOfMeasure: "",
            attributes: "",
            cost: "",
          },
        ],
      }
    })
    setFormErrors((current) => ({ ...current, variants: undefined }))
  }

  async function handleImageFileChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImageIndex(index)
    setActionError(null)

    try {
      const uploaded = await uploadImage.mutateAsync({
        file,
        folder: PRODUCT_IMAGE_FOLDER,
      })

      setFormValues((current) => ({
        ...current,
        images: current.images.map((image, imageIndex) =>
          imageIndex === index ? { key: uploaded.key, url: uploaded.url } : image
        ),
      }))
      setFormErrors((current) => {
        const nextImageErrors = [...(current.imageErrors ?? [])]
        nextImageErrors[index] = {}

        return {
          ...current,
          images: undefined,
          imageErrors: nextImageErrors,
        }
      })
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo subir la imagen."))
    } finally {
      setUploadingImageIndex(null)
      event.target.value = ""
    }
  }

  async function handleRemoveImage(index: number) {
    const image = formValues.images[index]
    const imageKey = image?.key.trim() ?? ""
    const imageUrl = image?.url.trim() ?? ""

    if (!imageKey || !imageUrl) {
      removeImageAtIndex(index)
      return
    }

    setDeletingImageIndex(index)
    setActionError(null)

    try {
      await deleteUploadImage.mutateAsync({ key: imageKey })
      removeImageAtIndex(index)
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          "No se pudo eliminar la imagen del almacenamiento."
        )
      )
    } finally {
      setDeletingImageIndex(null)
    }
  }

  function handleRemoveVariant(index: number) {
    setFormValues((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }))
    setFormErrors((current) => ({
      ...current,
      variants: undefined,
      variantErrors: (current.variantErrors ?? []).filter(
        (_, variantIndex) => variantIndex !== index
      ),
    }))
  }

  function openImagePicker(index: number) {
    imageInputRefs.current[index]?.click()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateProduct(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setActionError(null)

    try {
      if (isEditing) {
        if (!productId) {
          setActionError("No se encontro el producto a editar.")
          return
        }

        await updateProduct.mutateAsync({
          id: productId,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createProduct.mutateAsync(toCreatePayload(formValues))
      }

      router.push(productsHref)
      router.refresh()
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el producto."))
    }
  }

  const isSubmitting =
    createProduct.isPending ||
    updateProduct.isPending ||
    uploadImage.isPending ||
    deleteUploadImage.isPending

  const pageTitle = isEditing ? product?.name || "Editar producto" : "Nuevo producto"
  const pageDescription = isEditing
    ? "Actualiza categoria, precio, stock, visibilidad, variantes e imagenes."
    : "Registra un nuevo producto dentro del catalogo comercial."

  return (
    <main className="min-w-0 w-full space-y-5 bg-background p-2 sm:p-3 lg:p-4">
      <header className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-1 size-9 shrink-0 rounded-md border border-border bg-background text-muted-foreground shadow-none" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Gestion comercial
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {pageTitle}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {pageDescription}
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="h-9 w-full sm:w-auto">
            <Link href={productsHref}>
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>
      </header>

      {isEditing && !productId ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">
            No se encontro el identificador del producto a editar.
          </CardContent>
        </Card>
      ) : isEditing && productQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : isEditing && productQuery.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">
            {getApiErrorMessage(
              productQuery.error,
              "No se pudo cargar el producto para editar."
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</CardTitle>
            <CardDescription>
              Completa la informacion comercial y operativa del producto.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4">
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre" htmlFor="product-name" error={formErrors.name}>
                  <Input
                    id="product-name"
                    value={formValues.name}
                    onChange={(event) => handleFieldChange("name", event.target.value)}
                    placeholder="Ej. Collar de plata"
                    maxLength={160}
                    aria-invalid={Boolean(formErrors.name)}
                  />
                </Field>

                <Field
                  label="Marca"
                  htmlFor="product-brand"
                  error={formErrors.brand}
                  hint="Opcional."
                >
                  <Input
                    id="product-brand"
                    value={formValues.brand}
                    onChange={(event) => handleFieldChange("brand", event.target.value)}
                    placeholder="Ej. Silver Line"
                    maxLength={120}
                    aria-invalid={Boolean(formErrors.brand)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="product-category"
                    className="text-sm font-medium text-foreground"
                  >
                    Categoria
                  </label>
                  <select
                    id="product-category"
                    value={formValues.categoryId}
                    onChange={(event) => handleFieldChange("categoryId", event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                    aria-invalid={Boolean(formErrors.categoryId)}
                  >
                    <option value="">Sin categoria</option>
                    {categories.map((category) => {
                      const meta = getCategoryDisplayMeta(category.id, categories)
                      return (
                        <option key={String(category.id)} value={String(category.id)}>
                          {meta.isRoot
                            ? `Categoria principal: ${meta.label}`
                            : `${meta.label} (${meta.helper})`}
                        </option>
                      )
                    })}
                  </select>
                  {formErrors.categoryId ? (
                    <p className="text-xs text-destructive">{formErrors.categoryId}</p>
                  ) : categoriesQuery.isError ? (
                    <p className="text-xs text-destructive">
                      {getApiErrorMessage(
                        categoriesQuery.error,
                        "No se pudieron cargar las categorias."
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Si eliges una subcategoria, la principal se infiere por su parentId.
                    </p>
                  )}
                </div>

                <Field
                  label="Tipo de producto"
                  htmlFor="product-type"
                  error={formErrors.productType}
                >
                  <select
                    id="product-type"
                    value={formValues.productType}
                    onChange={(event) => handleFieldChange("productType", event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                    aria-invalid={Boolean(formErrors.productType)}
                  >
                    {PRODUCT_TYPE_VALUES.map((productType) => (
                      <option key={productType} value={productType}>
                        {formatProductType(productType)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="Descripcion"
                htmlFor="product-description"
                error={formErrors.description}
                hint="Opcional. Hasta 1000 caracteres."
              >
                <textarea
                  id="product-description"
                  value={formValues.description}
                  onChange={(event) => handleFieldChange("description", event.target.value)}
                  placeholder="Ej. Modelo premium"
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Precio de venta"
                  htmlFor="product-sale-price"
                  error={formErrors.salePrice}
                >
                  <Input
                    id="product-sale-price"
                    inputMode="decimal"
                    value={formValues.salePrice}
                    onChange={(event) => handleFieldChange("salePrice", event.target.value)}
                    placeholder="0.00"
                    aria-invalid={Boolean(formErrors.salePrice)}
                  />
                </Field>

                <Field
                  label="Impuesto (%)"
                  htmlFor="product-tax-rate"
                  error={formErrors.taxRate}
                >
                  <Input
                    id="product-tax-rate"
                    inputMode="decimal"
                    value={formValues.taxRate}
                    onChange={(event) => handleFieldChange("taxRate", event.target.value)}
                    placeholder="18"
                    aria-invalid={Boolean(formErrors.taxRate)}
                  />
                </Field>

                <Field
                  label="Stock minimo"
                  htmlFor="product-min-stock"
                  error={formErrors.minStock}
                  hint="Opcional. Entero >= 0."
                >
                  <Input
                    id="product-min-stock"
                    inputMode="numeric"
                    value={formValues.minStock}
                    onChange={(event) => handleFieldChange("minStock", event.target.value)}
                    placeholder="0"
                    aria-invalid={Boolean(formErrors.minStock)}
                  />
                </Field>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Resumen
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatMoney(Number(formValues.salePrice || 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Impuesto {formatTaxRate(Number(formValues.taxRate || 0))}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <ToggleCard
                  title="Activo"
                  description="Disponible para operar."
                  checked={formValues.isActive}
                  onChange={(checked) => handleFieldChange("isActive", checked)}
                />
                <ToggleCard
                  title="Controla stock"
                  description="Usar niveles minimos y control de inventario."
                  checked={formValues.trackStock}
                  onChange={(checked) => handleFieldChange("trackStock", checked)}
                />
                <ToggleCard
                  title="Visible en POS"
                  description="Aparece en caja y ventas rapidas."
                  checked={formValues.visibleInPos}
                  onChange={(checked) => handleFieldChange("visibleInPos", checked)}
                />
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Variantes</p>
                    <p className="text-xs text-muted-foreground">
                      Configura SKU, barcode, unidad, costo y atributos por variante.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleAddVariant}
                    disabled={formValues.variants.length >= 100}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar variante
                  </Button>
                </div>

                {formErrors.variants ? (
                  <p className="text-xs text-destructive">{formErrors.variants}</p>
                ) : null}

                {formValues.variants.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                    No hay variantes registradas para este producto.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formValues.variants.map((variant, index) => {
                      const variantError = formErrors.variantErrors?.[index]

                      return (
                        <div
                          key={`variant-${variant.id ?? index}`}
                          className="rounded-lg border border-border/70 bg-background p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Variante {index + 1}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {variant.id ? `ID ${variant.id}` : "Nueva variante aun no guardada."}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveVariant(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Quitar
                            </Button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <Field
                              label="SKU"
                              htmlFor={`product-variant-sku-${index}`}
                              error={variantError?.sku}
                            >
                              <Input
                                id={`product-variant-sku-${index}`}
                                value={variant.sku}
                                onChange={(event) => handleVariantChange(index, "sku", event.target.value)}
                                placeholder="SKU-001"
                                maxLength={80}
                              />
                            </Field>

                            <Field
                              label="Barcode"
                              htmlFor={`product-variant-barcode-${index}`}
                              error={variantError?.barcode}
                              hint="Opcional."
                            >
                              <Input
                                id={`product-variant-barcode-${index}`}
                                value={variant.barcode}
                                onChange={(event) => handleVariantChange(index, "barcode", event.target.value)}
                                placeholder="7751234567890"
                                maxLength={120}
                              />
                            </Field>

                            <div className="space-y-2">
                              <label
                                htmlFor={`product-variant-unit-${index}`}
                                className="text-sm font-medium text-foreground"
                              >
                                Unidad
                              </label>
                              <select
                                id={`product-variant-unit-${index}`}
                                value={variant.unitOfMeasure}
                                onChange={(event) => handleVariantChange(index, "unitOfMeasure", event.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                aria-invalid={Boolean(variantError?.unitOfMeasure)}
                              >
                                <option value="">Sin unidad</option>
                                {UNIT_OF_MEASURE_VALUES.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                              {variantError?.unitOfMeasure ? (
                                <p className="text-xs text-destructive">{variantError.unitOfMeasure}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Opcional.</p>
                              )}
                            </div>

                            <Field
                              label="Costo"
                              htmlFor={`product-variant-cost-${index}`}
                              error={variantError?.cost}
                              hint="Opcional. Hasta 2 decimales."
                            >
                              <Input
                                id={`product-variant-cost-${index}`}
                                inputMode="decimal"
                                value={variant.cost}
                                onChange={(event) => handleVariantChange(index, "cost", event.target.value)}
                                placeholder="0.00"
                              />
                            </Field>
                          </div>

                          <Field
                            label="Atributos JSON"
                            htmlFor={`product-variant-attributes-${index}`}
                            error={variantError?.attributes}
                            hint='Opcional. Ejemplo: {"color":"rojo","talla":"M"}'
                          >
                            <textarea
                              id={`product-variant-attributes-${index}`}
                              value={variant.attributes}
                              onChange={(event) => handleVariantChange(index, "attributes", event.target.value)}
                              rows={4}
                              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                          </Field>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Imagenes</p>
                    <p className="text-xs text-muted-foreground">
                      Sube archivos usando la carpeta `products` o completa key y URL.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleAddImage}
                    disabled={
                      formValues.images.length >= 10 ||
                      uploadImage.isPending ||
                      deleteUploadImage.isPending
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Agregar imagen
                  </Button>
                </div>

                {formErrors.images ? (
                  <p className="text-xs text-destructive">{formErrors.images}</p>
                ) : null}

                {formValues.images.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                    No hay imagenes registradas para este producto.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formValues.images.map((image, index) => {
                      const imageError = formErrors.imageErrors?.[index]
                      const isUploadingImage = uploadImage.isPending && uploadingImageIndex === index
                      const isDeletingImage = deleteUploadImage.isPending && deletingImageIndex === index
                      const isImageBusy = isUploadingImage || isDeletingImage

                      return (
                        <div
                          key={`image-${index}`}
                          className="rounded-lg border border-border/70 bg-background p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">Imagen {index + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                {isUploadingImage
                                  ? "Subiendo archivo..."
                                  : isDeletingImage
                                    ? "Eliminando archivo..."
                                    : image.url
                                      ? "Imagen cargada y lista para guardarse."
                                      : "Selecciona un archivo para completar key y URL."}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                ref={(node) => {
                                  imageInputRefs.current[index] = node
                                }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => void handleImageFileChange(index, event)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => openImagePicker(index)}
                                disabled={isImageBusy}
                              >
                                <ImagePlus className="h-4 w-4" />
                                {isUploadingImage ? "Subiendo..." : "Subir archivo"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={() => void handleRemoveImage(index)}
                                disabled={isImageBusy}
                              >
                                <Trash2 className="h-4 w-4" />
                                {isDeletingImage ? "Quitando..." : "Quitar"}
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Vista previa
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Asi vera el equipo la imagen del producto.
                                </p>
                              </div>
                              <ProductImagePreview
                                url={image.url}
                                label={`Vista previa de la imagen ${index + 1}`}
                                size="editor"
                              />
                              {image.url ? (
                                <a
                                  href={image.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
                                >
                                  Abrir imagen en otra pestana
                                </a>
                              ) : null}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <Field
                                label="Key"
                                htmlFor={`product-image-key-${index}`}
                                error={imageError?.key}
                              >
                                <Input
                                  id={`product-image-key-${index}`}
                                  value={image.key}
                                  onChange={(event) => handleImageChange(index, "key", event.target.value)}
                                  placeholder="tenant-id/products/archivo.jpg"
                                  maxLength={500}
                                  disabled={isImageBusy}
                                />
                              </Field>
                              <Field
                                label="URL"
                                htmlFor={`product-image-url-${index}`}
                                error={imageError?.url}
                              >
                                <Input
                                  id={`product-image-url-${index}`}
                                  value={image.url}
                                  onChange={(event) => handleImageChange(index, "url", event.target.value)}
                                  placeholder="https://..."
                                  maxLength={1000}
                                  disabled={isImageBusy}
                                />
                              </Field>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {actionError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {actionError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(productsHref)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isSubmitting
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar cambios"
                      : "Crear producto"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function ProductImagePreview({
  url,
  label,
  size = "md",
}: {
  url?: string | null
  label: string
  size?: "sm" | "md" | "editor"
}) {
  const sizeClassMap = {
    sm: "h-14 w-14 rounded-xl",
    md: "h-18 w-18 rounded-2xl",
    editor: "h-32 w-full rounded-2xl",
  } as const

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-border/70 bg-muted/30 text-muted-foreground ${sizeClassMap[size]}`}
      >
        <div className="text-center">
          <ImagePlus className="mx-auto h-5 w-5" />
          <span className="mt-2 block text-[11px] font-medium">Sin imagen</span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`border border-border/60 bg-muted/20 bg-cover bg-center shadow-sm ${sizeClassMap[size]}`}
      style={{ backgroundImage: `url("${url}")` }}
    />
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-muted/10 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-input"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
