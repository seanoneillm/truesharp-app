# Modal Centering Implementation

## ✅ **Perfect Centering Achieved**

### **Dialog Container (src/components/ui/dialog.tsx)**
```css
/* Main container - centers content both horizontally and vertically */
.fixed .inset-0 .z-50 .flex .items-center .justify-center .p-4 .overflow-y-auto

/* Content wrapper - constrains width and maintains centering */
.relative .z-10 .w-full .max-w-[95vw]
```

### **Modal Content (src/components/analytics/how-to-link-sportsbooks-modal.tsx)**
```css
/* Responsive width constraints with auto centering */
.w-full .max-w-[95vw] .sm:max-w-[90vw] .md:max-w-4xl .max-h-[90vh] .mx-auto

/* Scrollable content area */
.max-h-[70vh] .overflow-y-auto
```

## **📱 Responsive Behavior**

### **Mobile (< 640px)**
- `max-w-[95vw]` - Modal uses 95% of viewport width
- Padding ensures modal doesn't touch screen edges

### **Small screens (640px - 768px)**  
- `sm:max-w-[90vw]` - Modal uses 90% of viewport width
- More breathing room on larger phones/tablets

### **Medium+ screens (768px+)**
- `md:max-w-4xl` - Modal has fixed max-width of 4xl (896px)
- Perfectly centered with auto margins

## **🎯 Centering Method**
1. **Flexbox centering** on main container (`flex items-center justify-center`)
2. **Auto margins** on content (`mx-auto`) 
3. **Viewport constraints** prevent overflow on small screens
4. **Overflow scrolling** maintains usability when content is tall

## **✨ Result**
- ✅ Perfect horizontal and vertical centering
- ✅ Responsive on all screen sizes  
- ✅ Scrollable when content overflows
- ✅ Never extends beyond screen boundaries
- ✅ Smooth transitions and backdrop blur