import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gen-surface group-[.toaster]:text-gen-text group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg group-[.toaster]:font-mono group-[.toaster]:tracking-widest group-[.toaster]:border-2 group-[.toaster]:rounded-none",
          description: "group-[.toast]:text-gen-text-muted",
          actionButton:
            "group-[.toast]:bg-gen-lime group-[.toast]:text-gen-bg group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-gen-surface-hover group-[.toast]:text-gen-text-muted",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
