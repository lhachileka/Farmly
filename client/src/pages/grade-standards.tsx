import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Award, ShieldCheck, Leaf, Beef, Store, Building2, Truck, Users } from "lucide-react";
import { gradesApi, type GradeDefinition } from "@/lib/api";

function GradeCard({ definition }: { definition: GradeDefinition }) {
  const gradeColors = {
    A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300",
    B: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300",
    C: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300",
  };

  const gradeBadgeColors = {
    A: "bg-green-500",
    B: "bg-yellow-500",
    C: "bg-orange-500",
  };

  return (
    <Card className={`border-2 ${gradeColors[definition.grade]}`} data-testid={`grade-card-${definition.category}-${definition.grade}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`text-lg px-3 py-1 ${gradeBadgeColors[definition.grade]} text-white`}>
              {definition.grade}
            </Badge>
            <div>
              <CardTitle className="text-lg">{definition.name}</CardTitle>
              <CardDescription className="capitalize">{definition.category}</CardDescription>
            </div>
          </div>
          {definition.grade === "A" && (
            <Award className="h-8 w-8 text-green-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{definition.description}</p>
        
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Quality Criteria
          </h4>
          <ul className="space-y-1.5">
            {definition.criteria.map((criterion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1">•</span>
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Suitable For
          </h4>
          <div className="flex flex-wrap gap-2">
            {definition.suitableFor.map((use, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {use}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GradeStandards() {
  const { data: produceGrades, isLoading: loadingProduce } = useQuery({
    queryKey: ["grades", "produce"],
    queryFn: () => gradesApi.getDefinitions("produce"),
  });

  const { data: livestockGrades, isLoading: loadingLivestock } = useQuery({
    queryKey: ["grades", "livestock"],
    queryFn: () => gradesApi.getDefinitions("livestock"),
  });

  const isLoading = loadingProduce || loadingLivestock;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4" data-testid="grade-standards-page">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3">Quality Grading Standards</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Farmly uses a standardized grading system to ensure consistent quality expectations 
              between producers and buyers. All products are graded as A, B, or C.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center p-4">
              <div className="flex justify-center mb-2">
                <Badge className="bg-green-500 text-white text-lg px-4 py-1">A</Badge>
              </div>
              <h3 className="font-semibold">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">Best-in-class products for contracts and export</p>
            </Card>
            <Card className="text-center p-4">
              <div className="flex justify-center mb-2">
                <Badge className="bg-yellow-500 text-white text-lg px-4 py-1">B</Badge>
              </div>
              <h3 className="font-semibold">Standard Quality</h3>
              <p className="text-sm text-muted-foreground">Good quality for general trade and restaurants</p>
            </Card>
            <Card className="text-center p-4">
              <div className="flex justify-center mb-2">
                <Badge className="bg-orange-500 text-white text-lg px-4 py-1">C</Badge>
              </div>
              <h3 className="font-semibold">Economy Quality</h3>
              <p className="text-sm text-muted-foreground">Suitable for local markets and processing</p>
            </Card>
          </div>

          <Tabs defaultValue="produce" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="produce" className="flex items-center gap-2" data-testid="tab-produce">
                <Leaf className="h-4 w-4" />
                Produce
              </TabsTrigger>
              <TabsTrigger value="livestock" className="flex items-center gap-2" data-testid="tab-livestock">
                <Beef className="h-4 w-4" />
                Livestock
              </TabsTrigger>
            </TabsList>

            <TabsContent value="produce" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading grade standards...</div>
              ) : (
                <>
                  {produceGrades?.map((grade) => (
                    <GradeCard key={grade.id} definition={grade} />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="livestock" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading grade standards...</div>
              ) : (
                <>
                  {livestockGrades?.map((grade) => (
                    <GradeCard key={grade.id} definition={grade} />
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-8" />

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Farmly Verified Grading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For bulk orders, subscription contracts, and co-op deliveries, Farmly offers 
                verified grading by approved inspectors. Verified products display a 
                <Badge className="mx-1 bg-primary">Farmly Verified</Badge> badge.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Bulk Orders</h4>
                    <p className="text-sm text-muted-foreground">Independent verification for large purchases</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Subscriptions</h4>
                    <p className="text-sm text-muted-foreground">Regular quality checks for recurring orders</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Co-Op Deliveries</h4>
                    <p className="text-sm text-muted-foreground">Pooled orders verified before fulfillment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How Grading Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-medium">Seller Declares Grade</h4>
                    <p className="text-sm text-muted-foreground">When creating a listing, sellers select the grade that matches their product quality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-medium">Media Verification</h4>
                    <p className="text-sm text-muted-foreground">Sellers upload at least 3 photos and 1 video showing product quality before delivery.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-medium">Buyer Confirmation</h4>
                    <p className="text-sm text-muted-foreground">After delivery, buyers confirm if the grade matches, is lower, or requires rejection.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">4</div>
                  <div>
                    <h4 className="font-medium">Trust Score Impact</h4>
                    <p className="text-sm text-muted-foreground">Accurate grading improves seller trust scores. Repeated mismatches affect visibility and eligibility.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
